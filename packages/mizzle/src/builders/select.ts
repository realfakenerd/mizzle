import {
    GetCommand,
    QueryCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Column } from "../core/column";
import type { SelectedFields as SelectedFieldsBase } from "../core/operations";
import { 
    type Expression,
} from "../expressions/operators";
import { Entity, type InferSelectModel, type PhysicalTable } from "../core/table";
import { BaseBuilder } from "./base";
import type { StrategyResolution } from "../core/strategies";
import type { IMizzleClient } from "../core/client";
import { buildExpression } from "../expressions/builder";

export type SelectedFields = SelectedFieldsBase<Column, PhysicalTable>;

export class SelectBuilder<TSelection extends SelectedFields | undefined> {
    constructor(
        private client: IMizzleClient,
        private fields?: TSelection,
    ) {}

    /**
     * Specifies the entity to select from.
     * 
     * @example
     * ```ts
     * const results = await db.select().from(users).execute();
     * ```
     * 
     * @param entity The Mizzle entity (table) to query.
     * @returns A SelectBase instance to further chain the query.
     */
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

    /**
     * Adds a filter criteria to the query.
     * 
     * For DynamoDB, this will be used as a `KeyConditionExpression` if the 
     * primary keys are provided, otherwise it will be used as a `FilterExpression`.
     * 
     * @example
     * ```ts
     * import { eq, and, gt } from "@aurios/mizzle";
     * 
     * const results = await db.select()
     *   .from(users)
     *   .where(and(eq(users.id, 1), gt(users.age, 18)))
     *   .execute();
     * ```
     * 
     * @param expression The expression to filter by.
     * @returns The current builder instance for chaining.
     */
    where(expression: Expression): this {
        this._whereClause = expression;
        return this;
    }

    /**
     * Limits the total number of items returned by the query.
     * 
     * @example
     * ```ts
     * const results = await db.select().from(users).limit(10).execute();
     * ```
     * 
     * @param val The maximum number of items to return.
     * @returns The current builder instance for chaining.
     */
    limit(val: number): this {
        this._limitVal = val;
        return this;
    }

    /**
     * Sets the page size for the underlying DynamoDB requests. 
     * Use this with `.iterator()` to control how many items are fetched in each network request.
     * 
     * @param val The number of items per page.
     * @returns The current builder instance for chaining.
     */
    pageSize(val: number): this {
        this._pageSizeVal = val;
        return this;
    }

    /**
     * Enables or disables consistent reads for this query.
     * 
     * @param enabled Whether consistent read is enabled. Defaults to true.
     * @returns The current builder instance for chaining.
     */
    consistentRead(enabled: boolean = true): this {
        this._consistentReadVal = enabled;
        return this;
    }

    /**
     * Specifies the sort order for the query (only applicable for `Query` operations).
     * 
     * @param forward If true (default), results are sorted in ascending order. If false, descending.
     * @returns The current builder instance for chaining.
     */
    sort(forward: boolean): this {
        this._sortForward = forward;
        return this;
    }

    /**
     * Forces the use of a specific Global Secondary Index (GSI) or Local Secondary Index (LSI).
     * 
     * @param name The name of the index to use.
     * @returns The current builder instance for chaining.
     */
    index(name: string): this {
        this._forcedIndexName = name;
        return this;
    }

    /**
     * Returns an async iterator that automatically handles pagination.
     * 
     * @example
     * ```ts
     * for await (const user of db.select().from(users).iterator()) {
     *   console.log(user.name);
     * }
     * ```
     * 
     * @returns An AsyncIterableIterator for the query results.
     */
    iterator(): AsyncIterableIterator<TResult> {
        return (async function* (this: SelectBase<TEntity, TSelection, TResult>) {
            let lastEvaluatedKey: Record<string, unknown> | undefined;
            let count = 0;

            do {
                const result = await this.fetchPage(lastEvaluatedKey);
                
                for (const item of result.items) {
                    yield item;
                    count++;
                    if (this._limitVal !== undefined && count >= this._limitVal) {
                        return;
                    }
                }

                lastEvaluatedKey = result.lastEvaluatedKey;
            } while (lastEvaluatedKey);
        }).bind(this)();
    }

    private async fetchPage(exclusiveStartKey?: Record<string, unknown>): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, unknown> }> {
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

    /**
     * Executes the query and returns all matching items.
     * 
     * @returns A promise that resolves to an array of items.
     * @throws Error if the query fails.
     */
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

        const result = await this.client.send(command) as any;
        return result.Item ? ([this.mapToLogical(result.Item)] as TResult[]) : [];
    }

    private async executeQuery(
        resolution: StrategyResolution,
        exclusiveStartKey?: Record<string, unknown>,
    ): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, unknown> }> {
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

        const response = await this.client.send(command) as any;
        return {
            items: (response.Items || []).map((item: Record<string, unknown>) => this.mapToLogical(item)) as TResult[],
            lastEvaluatedKey: response.LastEvaluatedKey,
        };
    }

    private async executeScan(exclusiveStartKey?: Record<string, unknown>): Promise<{ items: TResult[], lastEvaluatedKey?: Record<string, unknown> }> {
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

        const response = await this.client.send(command) as any;
        return {
            items: (response.Items || []).map((item: Record<string, unknown>) => this.mapToLogical(item)) as TResult[],
            lastEvaluatedKey: response.LastEvaluatedKey,
        };
    }
}
