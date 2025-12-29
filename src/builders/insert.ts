import { PutCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "../constants";
import { Entity, PhysicalTable, type InferInsertModel } from "../core/table";
import { entityKind } from "../core/entity";
import { QueryPromise } from "./query-promise";
import { resolveStrategies, type KeyStrategy } from "../core/strategies";
import { Column } from "../core/column";

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
        const key = resolveStrategies(this.entity, undefined, itemToSave);
        const finalItem = { ...itemToSave, ...key.keys };

        const physicalTable = this.entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];
        const tableName = physicalTable[TABLE_SYMBOLS.TABLE_NAME];

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
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS];

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
