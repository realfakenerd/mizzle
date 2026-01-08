import {
    GetCommand,
    QueryCommand,
    ScanCommand,
    type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import type { Column } from "../core/column";
import type { SelectedFields as SelectedFieldsBase } from "../core/operations";
import { type Expression } from "../expressions/operators";
import { Entity, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";
import type { StrategyResolution } from "../core/strategies";

export type SelectedFields = SelectedFieldsBase<Column>;

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
    TResult = TSelection extends undefined ? InferSelectModel<TEntity> : Record<string, unknown>,
> extends BaseBuilder<TEntity, TResult[]> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "SelectBase";

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
        const resolution = this.resolveKeys(this.whereClause);

        // GetItem (PK + SK)
        if (resolution.hasPartitionKey && resolution.hasSortKey && !resolution.indexName) {
            return this.executeGet(resolution.keys);
        }

        // Query (PK only or Index)
        if (resolution.hasPartitionKey || resolution.indexName) {
            return this.executeQuery(resolution);
        }

        // Scan (No keys resolved)
        return this.executeScan();
    }

    private async executeGet(keys: Record<string, unknown>): Promise<TResult[]> {
        const command = new GetCommand({
            TableName: this.tableName,
            Key: keys,
        });

        const result = await this.client.send(command);
        return result.Item ? ([result.Item] as TResult[]) : [];
    }

    private async executeQuery(
        resolution: StrategyResolution,
    ): Promise<TResult[]> {
        let pkName: string;
        let skName: string | undefined;
        const physicalTable = this.physicalTable;

        if (resolution.indexName) {
            const indexes = physicalTable[TABLE_SYMBOLS.INDEXES];
            const indexBuilder = indexes?.[resolution.indexName] as { config: { pk: string; sk?: string } } | undefined;
            if (!indexes || !indexBuilder) {
                throw new Error(
                    `Index ${resolution.indexName} not found on table definition.`,
                );
            }
            pkName = indexBuilder.config.pk;
            skName = indexBuilder.config.sk;
        } else {
            pkName = (physicalTable[TABLE_SYMBOLS.PARTITION_KEY] as Column).name;
            skName = (physicalTable[TABLE_SYMBOLS.SORT_KEY] as Column | undefined)?.name;
        }

        const pkValue = resolution.keys[pkName];

        let keyConditionExpression = `${pkName} = :pk`;
        const expressionAttributeValues: Record<string, unknown> = {
            ":pk": pkValue,
        };

        if (resolution.hasSortKey && skName && resolution.keys[skName] !== undefined) {
            keyConditionExpression += ` AND ${skName} = :sk`;
            expressionAttributeValues[":sk"] = resolution.keys[skName];
        }

        const command = new QueryCommand({
            TableName: this.tableName,
            IndexName: resolution.indexName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        });

        const result = await this.client.send(command);
        return (result.Items ?? []) as TResult[];
    }

    private async executeScan(): Promise<TResult[]> {
        // WARN: Scanning is expensive!
        const command = new ScanCommand({
            TableName: this.tableName,
        });

        // TODO: Apply filter expression from this.whereClause if strictly scanning

        const result = await this.client.send(command);
        return (result.Items ?? []) as TResult[];
    }
}
