import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { type Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";
import { type IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";
import { buildExpression } from "../expressions/builder";
import { UpdateAction } from "../expressions/actions";
import { 
    createUpdateState, 
    partitionUpdateValues, 
    buildUpdateExpressionString 
} from "../expressions/update-builder";

export class UpdateBuilder<
    TEntity extends Entity,
    TResult = unknown,
> extends BaseBuilder<TEntity, TResult> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "UpdateBuilder";

    private _state = createUpdateState();
    private _whereClause?: Expression;
    private _returnValues?: "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW";
    private _explicitKey?: Record<string, unknown>;

    constructor(
        entity: TEntity,
        client: IMizzleClient,
    ) {
        super(entity, client);
    }

    key(keyObject: Record<string, unknown>): this {
        this._explicitKey = keyObject;
        return this;
    }

    set(values: Partial<{ [K in keyof InferInsertModel<TEntity>]: InferInsertModel<TEntity>[K] | UpdateAction }>): this {
        partitionUpdateValues(values as Record<string, any>, this._state, this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>);
        return this;
    }

    add(values: Partial<InferInsertModel<TEntity>>): this {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>;
        for (const [key, val] of Object.entries(values)) {
            const col = columns[key];
            this._state.add[key] = (col && typeof col.mapToDynamoValue === "function") 
                ? col.mapToDynamoValue(val) 
                : val;
        }
        return this;
    }

    remove(...fields: (keyof InferInsertModel<TEntity> | (string & {}))[]): this {
        this._state.remove.push(...(fields as string[]));
        return this;
    }

    delete(values: Partial<InferInsertModel<TEntity>>): this {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>;
        for (const [key, val] of Object.entries(values)) {
            const col = columns[key];
            this._state.delete[key] = (col && typeof col.mapToDynamoValue === "function") 
                ? col.mapToDynamoValue(val) 
                : val;
        }
        return this;
    }

    where(expression: Expression): this {
        this._whereClause = expression;
        return this;
    }

    returning(value: "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW"): this {
        this._returnValues = value;
        return this;
    }

    /** @internal */
    get state() {
        return this._state;
    }

    /** @internal */
    get whereClause() {
        return this._whereClause;
    }

    /** @internal */
    public override createExpressionContext(prefix = "") {
        return super.createExpressionContext(prefix);
    }

    public override async execute(): Promise<TResult> {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>;
        for (const [key, col] of Object.entries(columns)) {
            if (col.onUpdateFn && !this._state.set[key] && !this._state.remove.includes(key)) {
                const val = col.onUpdateFn();
                this._state.set[key] = { 
                    value: typeof col.mapToDynamoValue === "function" ? col.mapToDynamoValue(val) : val 
                };
            }
        }

        const keys = this.resolveUpdateKeys();

        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = this.createExpressionContext("up_");

        const updateExpression = buildUpdateExpressionString(this._state, addName, addValue);
        
        let conditionExpression: string | undefined;
        if (this._whereClause) {
            conditionExpression = buildExpression(this._whereClause, addName, addValue);
        }

        // Estimate size for Update
        // Update size is basically keys + attribute values.
        const size = calculateItemSize({ ...keys, ...expressionAttributeValues });
        if (size > 400 * 1024) {
            throw new ItemSizeExceededError(`Estimated update size of ${Math.round(size / 1024)}KB exceeds the 400KB limit.`);
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: keys,
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames:
                Object.keys(expressionAttributeNames).length > 0
                    ? expressionAttributeNames
                    : undefined,
            ExpressionAttributeValues:
                Object.keys(expressionAttributeValues).length > 0
                    ? expressionAttributeValues
                    : undefined,
            ReturnValues: this._returnValues,
        });

        const response = await this.client.send(command);
        return response.Attributes as TResult;
    }

    /** @internal */
    public resolveUpdateKeys(): Record<string, unknown> {
        if (this._explicitKey) {
            return this._explicitKey;
        }

        const resolved = this.resolveKeys(this._whereClause);
        return resolved.keys;
    }
}