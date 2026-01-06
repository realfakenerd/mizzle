import { PutCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "../constants";
import { Entity, type InferInsertModel } from "../core/table";
import { BaseBuilder } from "./base";

export class InsertBuilder<TEntity extends Entity> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "InsertBuilder";

    constructor(
        private entity: TEntity,
        private client: DynamoDBDocumentClient,
    ) {}

    values(values: InferInsertModel<TEntity>): InsertBase<TEntity> {
        return new InsertBase(this.entity, this.client, values);
    }
}

class InsertBase<
    TEntity extends Entity,
    TResult = undefined,
> extends BaseBuilder<TEntity, TResult> {
    private shouldReturnValues = false;

    constructor(
        entity: TEntity,
        client: DynamoDBDocumentClient,
        private valuesData: InferInsertModel<TEntity>,
    ) {
        super(entity, client);
    }

    returning(): InsertBase<TEntity, InferInsertModel<TEntity>> {
        this.shouldReturnValues = true;
        return this as any;
    }

    override async execute(): Promise<TResult> {
        const itemToSave = this.processValues(this.valuesData);
        const resolution = this.resolveKeys(undefined, itemToSave);
        
        let finalItem = { ...itemToSave, ...resolution.keys };

        // Also resolve GSI keys if they are defined in strategies but not in resolution.keys
        // resolveStrategies only returns PK/SK for main table or a specific index.
        // We need all of them for PutItem.
        const strategies = this.entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as Record<string, any>;
        const physicalTable = this.entity[ENTITY_SYMBOLS.PHYSICAL_TABLE] as any;
        const indexes = physicalTable[TABLE_SYMBOLS.INDEXES] || {};

        for (const [indexName, strategy] of Object.entries(strategies)) {
            if (indexName === "pk" || indexName === "sk") continue;

            const indexBuilder = indexes[indexName];
            if (indexBuilder) {
                // It's an index strategy
                if (strategy.pk && indexBuilder.config.pk) {
                    const pkValue = this.resolveStrategyValue(strategy.pk, itemToSave);
                    if (pkValue) finalItem[indexBuilder.config.pk] = pkValue;
                }
                if (strategy.sk && indexBuilder.config.sk) {
                    const skValue = this.resolveStrategyValue(strategy.sk, itemToSave);
                    if (skValue) finalItem[indexBuilder.config.sk] = skValue;
                }
            }
        }

        const command = new PutCommand({
            TableName: this.tableName,
            Item: finalItem,
        });

        await this.client.send(command);
        if (this.shouldReturnValues) return finalItem as unknown as TResult;

        return undefined as unknown as TResult;
    }

    private resolveStrategyValue(strategy: any, availableValues: Record<string, any>): string | undefined {
        if (strategy.type === "static") {
            return strategy.segments[0] as string;
        }

        const resolvedParts: string[] = [];

        for (const segment of strategy.segments) {
            if (typeof segment === "string") {
                resolvedParts.push(segment);
            } else {
                const val = availableValues[segment.name];
                if (val === undefined || val === null) return undefined;
                resolvedParts.push(String(val));
            }
        }

        if (strategy.type === "prefix") return resolvedParts.join("");
        if (strategy.type === "composite") return resolvedParts.join(strategy.separator || "#");
        return undefined;
    }

    private processValues(
        values: InferInsertModel<TEntity>,
    ): Record<string, any> {
        const item: any = { ...values };
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>;

        for (const [key, col] of Object.entries(columns)) {
            let value = item[key];

            if (value === undefined) {
                if (col.default !== undefined) item[key] = col.default;
                else if (col.defaultFn) item[key] = col.defaultFn();
            }

            value = item[key];

            if (["SS", "NS", "BS"].includes(col.columnType)) {
                if (Array.isArray(value)) {
                    const setVal = new Set(value);
                    item[key] = setVal;
                    if (setVal.size === 0) delete item[key];
                }
            }
        }

        return item;
    }
}
