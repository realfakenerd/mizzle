import {
    GetCommand,
    QueryCommand,
    ScanCommand,
    type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "../constants";
import type { Column } from "../core/column";
import { entityKind } from "../core/entity";
import type { SelectedFields as SelectedFieldsBase } from "../core/operations";
import { BinaryExpression, type Expression } from "../expressions/operators";
import { QueryPromise } from "./query-promise";
import { resolveStrategies } from "../core/strategies";
import { Entity, PhysicalTable, type InferSelectModel } from "../core/table";

import { resolveTableName } from "../utils/utils";

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
> extends QueryPromise<TResult[]> {
    static readonly [entityKind]: string = "SelectBase";

    private whereClause?: Expression;

    constructor(
        private entity: TEntity,
        private client: DynamoDBDocumentClient,
        private fields?: TSelection,
    ) {
        super();
    }

    where(expression: Expression): this {
        this.whereClause = expression;
        return this;
    }

    override async execute(): Promise<TResult[]> {
        const tableName = resolveTableName(this.entity);
        const physicalTable = this.entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];

        const { keys, hasPk, hasSk, indexName } = resolveStrategies(
            this.entity,
            this.whereClause,
        );

        // GetItem (PK + SK)
        if (hasPk && hasSk && !indexName) {
            const command = new GetCommand({
                TableName: tableName,
                Key: keys,
            });

            const result = await this.client.send(command);
            return result.Item ? ([result.Item] as TResult[]) : [];
        }

        // Query (PK only or Index)
        if (hasPk || indexName) {
            let pkName: string;
            let skName: string | undefined;

            if (indexName) {
                // Find index definition to get PK name
                const indexes = physicalTable[TABLE_SYMBOLS.INDEXES];
                if (!indexes || !indexes[indexName]) {
                     throw new Error(`Index ${indexName} not found on table definition.`);
                }
                pkName = indexes[indexName].config.pk!;
                skName = indexes[indexName].config.sk;
            } else {
                 pkName = physicalTable[TABLE_SYMBOLS.PARTITION_KEY].name;
                 skName = physicalTable[TABLE_SYMBOLS.SORT_KEY]?.name;
            }
            
            const pkValue = keys[pkName];
            
            // Construct KeyConditionExpression
            let keyConditionExpression = `${pkName} = :pk`;
            const expressionAttributeValues: Record<string, any> = {
                ":pk": pkValue,
            };

            if (hasSk && skName && keys[skName] !== undefined) {
                keyConditionExpression += ` AND ${skName} = :sk`;
                expressionAttributeValues[":sk"] = keys[skName];
            }

            const command = new QueryCommand({
                TableName: tableName,
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
            TableName: tableName,
        });
        
        // TODO: Apply filter expression from this.whereClause if strictly scanning

        const result = await this.client.send(command);
        return (result.Items ?? []) as TResult[];
    }
}
