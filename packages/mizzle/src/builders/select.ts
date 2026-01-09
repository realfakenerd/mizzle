import {
    GetCommand,
    QueryCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import { Column } from "../core/column";
import type { SelectedFields as SelectedFieldsBase } from "../core/operations";
import { 
    type Expression,
} from "../expressions/operators";
import { Entity, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";
import type { StrategyResolution } from "../core/strategies";
import type { IMizzleClient } from "../core/client";
import { buildExpression } from "../expressions/builder";

export type SelectedFields = SelectedFieldsBase<Column>;

export class SelectBuilder<TSelection extends SelectedFields | undefined> {
    constructor(
        private client: IMizzleClient,
        private fields?: TSelection,
    ) {}

    from<TEntity extends Entity>(entity: TEntity) {
        return new SelectBase(entity, this.client, this.fields);
    }
}

export class SelectBase<
    TEntity extends Entity,
    TSelection extends SelectedFields | undefined = undefined,
    TResult = TSelection extends undefined ? InferSelectModel<TEntity> : Record<string, unknown>,
> extends BaseBuilder<TEntity, TResult[]> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "SelectBase";

    private _whereClause?: Expression;
    private _limitVal?: number;
    private _pageSizeVal?: number;
    private _consistentReadVal?: boolean;
    private _sortForward: boolean = true;
    private _forcedIndexName?: string;

    constructor(
        entity: TEntity,
        client: IMizzleClient,
        private fields?: TSelection,
    ) {
        super(entity, client);
    }

    where(expression: Expression): this {
        this._whereClause = expression;
        return this;
    }

    limit(val: number): this {
        this._limitVal = val;
        return this;
    }

    pageSize(val: number): this {
        this._pageSizeVal = val;
        return this;
    }

    consistentRead(enabled: boolean = true): this {
        this._consistentReadVal = enabled;
        return this;
    }

    sort(forward: boolean): this {
        this._sortForward = forward;
        return this;
    }

    index(name: string): this {
        this._forcedIndexName = name;
        return this;
    }

    iterator(): AsyncIterableIterator<TResult> {
        const self = this;
        return (async function* () {
            let count = 0;
            let lastEvaluatedKey: Record<string, any> | undefined = undefined;

            do {
                const result = await self.fetchPage(lastEvaluatedKey);
                
                for (const item of result.items) {
                    yield item;
                    count++;
                    if (self._limitVal !== undefined && count >= self._limitVal) {
                        return;
                    }
                }

                lastEvaluatedKey = result.lastEvaluatedKey;
            } while (lastEvaluatedKey);
        })();
    }

    private async fetchPage(exclusiveStartKey?: Record<string, any>): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, any> }> {
        const resolution = this.resolveKeys(this._whereClause, undefined, this._forcedIndexName);

        if (resolution.hasPartitionKey && resolution.hasSortKey && !resolution.indexName && !exclusiveStartKey) {
            const items = await this.executeGet(resolution.keys);
            return { items };
        } else if (resolution.hasPartitionKey || resolution.indexName) {
            return await this.executeQuery(resolution, exclusiveStartKey);
        } else {
            return await this.executeScan(exclusiveStartKey);
        }
    }

    override async execute(): Promise<TResult[]> {
        const { items } = await this.fetchPage();
        return items;
    }

    private async executeGet(keys: Record<string, unknown>): Promise<TResult[]> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: keys,
            ConsistentRead: this._consistentReadVal,
        });

        const result = await this.client.send(command);
        return result.Item ? ([this.mapToLogical(result.Item)] as TResult[]) : [];
    }

    private async executeQuery(
        resolution: StrategyResolution,
        exclusiveStartKey?: Record<string, any>,
    ): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, any> }> {
        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = this.createExpressionContext();

        const keyParts: string[] = [];
        const keyAttrNames = new Set<string>();
        for (const [key, value] of Object.entries(resolution.keys)) {
            keyParts.push(`${addName(key)} = ${addValue(value)}`);
            keyAttrNames.add(key);
        }
        const keyConditionExpression = keyParts.join(" AND ");
        
        // DynamoDB does NOT allow primary key attributes in FilterExpression
        const filterExpression = this._whereClause 
            ? buildExpression(this._whereClause, addName, addValue, keyAttrNames)
            : undefined;

        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: resolution.indexName,
            KeyConditionExpression: keyConditionExpression,
            FilterExpression: filterExpression || undefined,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
            Limit: this._pageSizeVal ?? this._limitVal,
            ScanIndexForward: this._sortForward,
            ConsistentRead: resolution.indexName ? undefined : this._consistentReadVal,
            ExclusiveStartKey: exclusiveStartKey,
        });

        const response = await this.client.send(command);
        return {
            items: (response.Items || []).map(item => this.mapToLogical(item)) as TResult[],
            lastEvaluatedKey: response.LastEvaluatedKey,
        };
    }

    private async executeScan(exclusiveStartKey?: Record<string, any>): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, any> }> {
        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = this.createExpressionContext();

        const filterExpression = this._whereClause 
            ? buildExpression(this._whereClause, addName, addValue)
            : undefined;

        const command = new ScanCommand({
            TableName: this.tableName,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
            Limit: this._pageSizeVal ?? this._limitVal,
            ConsistentRead: this._consistentReadVal,
            ExclusiveStartKey: exclusiveStartKey,
        });

        const response = await this.client.send(command);
        return {
            items: (response.Items || []).map(item => this.mapToLogical(item)) as TResult[],
            lastEvaluatedKey: response.LastEvaluatedKey,
        };
    }
}
