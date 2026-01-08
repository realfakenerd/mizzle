import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { BaseBuilder } from "./base";
import { Column } from "../core/column";
import { KeyStrategy } from "../core/strategies";
import { type IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";

export class InsertBuilder<TEntity extends Entity> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "InsertBuilder";

    constructor(
        private entity: TEntity,
        private client: IMizzleClient,
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
        client: IMizzleClient,
        private valuesData: InferInsertModel<TEntity>,
    ) {
        super(entity, client);
    }

    returning(): InsertBase<TEntity, InferInsertModel<TEntity>> {
        this.shouldReturnValues = true;
        return this as unknown as InsertBase<TEntity, InferInsertModel<TEntity>>;
    }

    override async execute(): Promise<TResult> {
        const itemToSave = this.processValues(this.valuesData);
        const resolution = this.resolveKeys(undefined, itemToSave);
        
        const finalItem: Record<string, unknown> = { ...itemToSave, ...resolution.keys };

        // Also resolve GSI keys if they are defined in strategies but not in resolution.keys
        const strategies = this.entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as Record<string, { pk: KeyStrategy, sk?: KeyStrategy }>;
        const physicalTable = this.entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];
        const indexes = physicalTable[TABLE_SYMBOLS.INDEXES] || {};

        for (const [indexName, strategy] of Object.entries(strategies)) {
            if (indexName === "pk" || indexName === "sk") continue;

            const indexBuilder = indexes[indexName] as { config: { pk: string; sk?: string } } | undefined;
            if (indexBuilder) {
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

        // Size validation
        const size = calculateItemSize(finalItem);
        if (size > 400 * 1024) {
            throw new ItemSizeExceededError(`Item size of ${Math.round(size / 1024)}KB exceeds the 400KB limit.`);
        }

        const command = new PutCommand({
            TableName: this.tableName,
            Item: finalItem,
        });

        await this.client.send(command);
        if (this.shouldReturnValues) return finalItem as unknown as TResult;

        return undefined as unknown as TResult;
    }

    private resolveStrategyValue(strategy: KeyStrategy, availableValues: Record<string, unknown>): string | undefined {
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
    ): Record<string, unknown> {
        const item: Record<string, unknown> = { ...(values as Record<string, unknown>) };
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, Column>;

        for (const key in columns) {
            const col = columns[key];
            const value = item[key];

            if (value === undefined) {
                if (col.default !== undefined) item[key] = col.default;
                else if (col.defaultFn) item[key] = col.defaultFn();
            }

            const finalValue = item[key];

            if (["SS", "NS", "BS"].includes(col.columnType)) {
                if (Array.isArray(finalValue)) {
                    const setVal = new Set(finalValue);
                    item[key] = setVal;
                    if (setVal.size === 0) delete item[key];
                }
            }
        }

        return item;
    }
}
