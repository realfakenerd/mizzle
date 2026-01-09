import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { type Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";
import { type IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";
import { buildExpression } from "../expressions/builder";

export class UpdateBuilder<
    TEntity extends Entity,
    TResult = unknown,
> extends BaseBuilder<TEntity, TResult> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "UpdateBuilder";

    private _setValues: Partial<InferInsertModel<TEntity>> = {};
    private _addValues: Partial<InferInsertModel<TEntity>> = {};
    private _removeValues: (keyof InferInsertModel<TEntity>)[] = [];
    private _deleteValues: Partial<InferInsertModel<TEntity>> = {};
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

    set(values: Partial<InferInsertModel<TEntity>>): this {
        this._setValues = { ...this._setValues, ...values };
        return this;
    }

    add(values: Partial<InferInsertModel<TEntity>>): this {
        this._addValues = { ...this._addValues, ...values };
        return this;
    }

    remove(...fields: (keyof InferInsertModel<TEntity>)[]): this {
        this._removeValues.push(...fields);
        return this;
    }

    delete(values: Partial<InferInsertModel<TEntity>>): this {
        this._deleteValues = { ...this._deleteValues, ...values };
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

    override async execute(): Promise<TResult> {
        const keys = this.resolveUpdateKeys();

        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = this.createExpressionContext("up_");

        const { updateExpression } = this.buildUpdateExpression(addName, addValue);
        
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

    private resolveUpdateKeys(): Record<string, unknown> {
        if (this._explicitKey) {
            return this._explicitKey;
        }

        const resolved = this.resolveKeys(this._whereClause);
        return resolved.keys;
    }

    private buildUpdateExpression(
        addName: (name: string) => string,
        addValue: (value: unknown) => string,
    ) {
        const updateExpressions: string[] = [];

        if (Object.keys(this._setValues).length > 0) {
            const setParts: string[] = [];
            for (const [key, value] of Object.entries(this._setValues)) {
                if (value !== undefined) {
                    setParts.push(`${addName(key)} = ${addValue(value)}`);
                }
            }
            if (setParts.length > 0) {
                updateExpressions.push(`SET ${setParts.join(", ")}`);
            }
        }

        if (Object.keys(this._addValues).length > 0) {
            const addParts: string[] = [];
            for (const [key, value] of Object.entries(this._addValues)) {
                if (value !== undefined) {
                    addParts.push(`${addName(key)} ${addValue(value)}`);
                }
            }
            if (addParts.length > 0) {
                updateExpressions.push(`ADD ${addParts.join(", ")}`);
            }
        }

        if (this._removeValues.length > 0) {
            const removeParts: string[] = [];
            for (const field of this._removeValues) {
                removeParts.push(addName(field as string));
            }
            updateExpressions.push(`REMOVE ${removeParts.join(", ")}`);
        }

        if (Object.keys(this._deleteValues).length > 0) {
            const deleteParts: string[] = [];
            for (const [key, value] of Object.entries(this._deleteValues)) {
                if (value !== undefined) {
                    deleteParts.push(`${addName(key)} ${addValue(value)}`);
                }
            }
            if (deleteParts.length > 0) {
                updateExpressions.push(`DELETE ${deleteParts.join(", ")}`);
            }
        }

        return {
            updateExpression: updateExpressions.join(" "),
        };
    }
}