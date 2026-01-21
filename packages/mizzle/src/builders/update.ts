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

    /**
     * Manually specifies the primary key for the update operation.
     * 
     * @param keyObject The raw DynamoDB key object (e.g., { pk: "USER#1", sk: "METADATA" }).
     * @returns The current builder instance for chaining.
     */
    key(keyObject: Record<string, unknown>): this {
        this._explicitKey = keyObject;
        return this;
    }

    /**
     * Sets specific attributes to new values. 
     * Translates to a `SET` action in the DynamoDB UpdateExpression.
     * 
     * @example
     * ```ts
     * await db.update(users)
     *   .set({ name: "Bob", age: 25 })
     *   .where(eq(users.id, "1"))
     *   .execute();
     * ```
     * 
     * @param values Object containing the fields and values to set.
     * @returns The current builder instance for chaining.
     */
    set(values: Partial<{ [K in keyof InferInsertModel<TEntity>]: InferInsertModel<TEntity>[K] | UpdateAction }>): this {
        partitionUpdateValues(values as Record<string, unknown | UpdateAction>, this._state, this.entity[ENTITY_SYMBOLS.COLUMNS] as unknown as Record<string, Column>);
        return this;
    }

    /**
     * Adds a value to a numeric attribute or elements to a set.
     * Translates to an `ADD` action in the DynamoDB UpdateExpression.
     * 
     * @param values Object containing fields and values to add.
     * @returns The current builder instance for chaining.
     */
    add(values: Partial<InferInsertModel<TEntity>>): this {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as unknown as Record<string, Column>;
        for (const [key, val] of Object.entries(values)) {
            const col = columns[key] as unknown as { mapToDynamoValue?: (v: unknown) => unknown };
            this._state.add[key] = (col && typeof col.mapToDynamoValue === "function") 
                ? col.mapToDynamoValue(val) 
                : val;
        }
        return this;
    }

    /**
     * Removes one or more attributes from the item.
     * Translates to a `REMOVE` action in the DynamoDB UpdateExpression.
     * 
     * @param fields The names of the fields to remove.
     * @returns The current builder instance for chaining.
     */
    remove(...fields: (keyof InferInsertModel<TEntity> | (string & {}))[]): this {
        this._state.remove.push(...(fields as string[]));
        return this;
    }

    /**
     * Deletes elements from a set.
     * Translates to a `DELETE` action in the DynamoDB UpdateExpression.
     * 
     * @param values Object containing fields and the values to delete from the set.
     * @returns The current builder instance for chaining.
     */
    delete(values: Partial<InferInsertModel<TEntity>>): this {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as unknown as Record<string, Column>;
        for (const [key, val] of Object.entries(values)) {
            const col = columns[key] as unknown as { mapToDynamoValue?: (v: unknown) => unknown };
            this._state.delete[key] = (col && typeof col.mapToDynamoValue === "function") 
                ? col.mapToDynamoValue(val) 
                : val;
        }
        return this;
    }

    /**
     * Adds a condition to the update operation.
     * 
     * @param expression The condition expression.
     * @returns The current builder instance for chaining.
     */
    where(expression: Expression): this {
        this._whereClause = expression;
        return this;
    }

    /**
     * Configures what values should be returned after the update.
     * 
     * @param value One of: "NONE", "ALL_OLD", "UPDATED_OLD", "ALL_NEW", "UPDATED_NEW".
     * @returns The current builder instance for chaining.
     */
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

    /**
     * Executes the update operation.
     * 
     * @returns A promise that resolves to the requested attributes (based on `.returning()`).
     * @throws {ItemSizeExceededError} if the update exceeds 400KB.
     */
    public override async execute(): Promise<TResult> {
        const columns = this.entity[ENTITY_SYMBOLS.COLUMNS] as unknown as Record<string, Column>;
        for (const [key, col] of Object.entries(columns)) {
            const column = col as unknown as { onUpdateFn?: () => unknown, mapToDynamoValue?: (v: unknown) => unknown };
            if (column.onUpdateFn && !this._state.set[key] && !this._state.remove.includes(key)) {
                const val = column.onUpdateFn();
                this._state.set[key] = { 
                    value: typeof column.mapToDynamoValue === "function" ? column.mapToDynamoValue(val) : val 
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