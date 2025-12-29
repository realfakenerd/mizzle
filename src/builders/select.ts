import {
    GetCommand,
    QueryCommand,
    ScanCommand,
    type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { TABLE_SYMBOLS } from "../constants";
import type { Column } from "../core/column";
import { entityKind } from "../core/entity";
import type { SelectedFields as SelectedFieldsBase } from "../core/operations";
import { type Expression } from "../expressions/operators";
import { Entity, PhysicalTable, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";

export type SelectedFields = SelectedFieldsBase<Column, PhysicalTable>;

export class SelectBuilder<TSelection extends SelectedFields | undefined> {
    constructor(
        private client: DynamoDBDocumentClient,
        private fields?: TSelection,
    ) {}

    from<TEntity extends Entity>(entity: TEntity) {
        return new SelectBase(entity, this.client, this.fields);
    }
}

class SelectBase<
    TEntity extends Entity,
    TSelection extends SelectedFields | undefined = undefined,
    TResult = TSelection extends undefined ? InferSelectModel<TEntity> : any,
> extends BaseBuilder<TEntity, TResult[]> {
    static readonly [entityKind]: string = "SelectBase";

    private whereClause?: Expression;

    constructor(
        entity: TEntity,
        client: DynamoDBDocumentClient,
        private fields?: TSelection,
    ) {
        super(entity, client);
    }

    where(expression: Expression): this {
        this.whereClause = expression;
        return this;
    }

    override async execute(): Promise<TResult[]> {
        const { keys, hasPartitionKey, hasSortKey, indexName } = this.resolveKeys(
            this.whereClause,
        );

        // GetItem (PK + SK)
        if (hasPartitionKey && hasSortKey && !indexName) {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: keys,
            });

            const result = await this.client.send(command);
            return result.Item ? ([result.Item] as TResult[]) : [];
        }

        // Query (PK only or Index)
        if (hasPartitionKey || indexName) {
            let pkName: string;
            let skName: string | undefined;

            if (indexName) {
                // Find index definition to get PK name
                const indexes = this.physicalTable[TABLE_SYMBOLS.INDEXES];
                if (!indexes || !indexes[indexName]) {
                     throw new Error(`Index ${indexName} not found on table definition.`);
                }
                pkName = indexes[indexName].config.pk!;
                skName = indexes[indexName].config.sk;
            } else {
                 pkName = this.physicalTable[TABLE_SYMBOLS.PARTITION_KEY].name;
                 skName = this.physicalTable[TABLE_SYMBOLS.SORT_KEY]?.name;
            }
            
            const pkValue = keys[pkName];
            
            // Construct KeyConditionExpression
            let keyConditionExpression = `${pkName} = :pk`;
            const expressionAttributeValues: Record<string, any> = {
                ":pk": pkValue,
            };

            if (hasSortKey && skName && keys[skName] !== undefined) {
                keyConditionExpression += ` AND ${skName} = :sk`;
                expressionAttributeValues[":sk"] = keys[skName];
            }

            const command = new QueryCommand({
                TableName: this.tableName,
                IndexName: indexName,
                KeyConditionExpression: keyConditionExpression,
                ExpressionAttributeValues: expressionAttributeValues,
            });

             const result = await this.client.send(command);
             return (result.Items ?? []) as TResult[];
        }

        // Scan (No keys resolved)
        // WARN: Scanning is expensive!
        const command = new ScanCommand({
            TableName: this.tableName,
        });
        
        // TODO: Apply filter expression from this.whereClause if strictly scanning

        const result = await this.client.send(command);
        return (result.Items ?? []) as TResult[];
    }
}
