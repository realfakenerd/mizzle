import { PutCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Entity, PhysicalTable, type InferInsertModel } from "../table";
import { entityKind } from "../entity";
import { QueryPromise } from "../query-promise";
import type { KeyStrategy } from "../strategies";
import { Column } from "../column";

export class InsertBuilder<TEntity extends Entity> {
    static readonly [entityKind]: string = "InsertBuilder";

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
> extends QueryPromise<TResult> {
    private shouldReturnValues = false;

    constructor(
        private entity: TEntity,
        private client: DynamoDBDocumentClient,
        private valuesData: InferInsertModel<TEntity>,
    ) {
        super();
    }

    returning(): InsertBase<TEntity, InferInsertModel<TEntity>> {
        this.shouldReturnValues = true;
        return this as any;
    }

    override async execute(): Promise<TResult> {
        const itemToSave = this.processValues(this.valuesData);
        const key = this.resolveStrategies(itemToSave);
        const finalItem = { ...itemToSave, ...key };

        const physicalTable = this.entity[Entity.Symbol.PhysicalTableSymbol];
        const tableName = physicalTable[PhysicalTable.Symbol.TableName];

        const command = new PutCommand({
            TableName: tableName,
            Item: finalItem,
        });

        await this.client.send(command);
        if (this.shouldReturnValues) return finalItem as unknown as TResult;

        return undefined as unknown as TResult;
    }

    private processValues(
        values: InferInsertModel<TEntity>,
    ): Record<string, any> {
        const item: any = { ...values };
        const columns = this.entity[Entity.Symbol.Columns];

        for (const [key, col] of Object.entries(columns)) {
            let value = item[key];

            if (value === undefined) {
                if (col.default !== undefined) item[key] = col.default;
                else if (col.defaultFn) item[key] = col.defaultFn();
            }

            value = item[key];

            if (["SS", "NS", "BS"].includes(col.dataType)) {
                if (Array.isArray(value)) {
                    const setVal = new Set(value);
                    item[key] = setVal;
                    if (setVal.size === 0) delete item[key];
                }
            }
        }

        return item;
    }

    private resolveStrategies(item: Record<string, any>): Record<string, any> {
        const strategies = this.entity[Entity.Symbol.EntityStrategy];
        const physicalTable = this.entity[Entity.Symbol.PhysicalTableSymbol];
        const generatedKeys: Record<string, any> = {};

        const resolveKey = (strategy: KeyStrategy): string => {
            if (strategy.type === "static")
                return strategy.segments[0] as string;

            const parts = strategy.segments.map((seg) => {
                if (typeof seg === "string") return seg;
                if (seg instanceof Column) {
                    const val = item[seg.name];
                    if (val === undefined || val === null) {
                        throw new Error(
                            `Cannot resolve key strategy for ${seg.name} is undefined or null`,
                        );
                    }
                    return String(val);
                }

                return "";
            });

            if (strategy.type === "prefix") return parts.join("");
            if (strategy.type === "composite")
                return parts.join(strategy.separator || "#");

            return "";
        };

        if (strategies.pk) {
            const pkCol = physicalTable[PhysicalTable.Symbol.PartitionKey];
            generatedKeys[pkCol.name] = resolveKey(strategies.pk);
        }

        if (strategies.sk) {
            const skCol = physicalTable[PhysicalTable.Symbol.SortKey];
            if (skCol) generatedKeys[skCol.name] = resolveKey(strategies.sk);
        }

        for (const [key, strategyConfig] of Object.entries(strategies)) {
            if (key === "pk" || key === "sk") continue;

            const indexConfig =
                physicalTable[PhysicalTable.Symbol.Indexes]?.[key];
            if (!indexConfig) continue;

            const typedStrategy = strategyConfig as any;

            if (typedStrategy.pk && indexConfig.config.pk) {
                generatedKeys[indexConfig.config.pk] = resolveKey(
                    typedStrategy.pk,
                );
            }
            if (typedStrategy.sk && indexConfig.config.sk) {
                generatedKeys[indexConfig.config.sk] = resolveKey(
                    typedStrategy.sk,
                );
            }
        }

        return generatedKeys;
    }
}
