import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { type Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";
import { type IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";

export class UpdateBuilder<
    TEntity extends Entity,
    TResult = unknown,
> extends BaseBuilder<TEntity, TResult> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "UpdateBuilder";

    private _setValues: Partial<InferInsertModel<TEntity>> = {};
    private _addValues: Record<string, unknown> = {};
    private _removeValues: string[] = [];
    private _deleteValues: Record<string, unknown> = {};
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

    add(values: Record<string, unknown>): this {
        this._addValues = { ...this._addValues, ...values };
        return this;
    }

    remove(...fields: string[]): this {
        this._removeValues.push(...fields);
        return this;
    }

    delete(values: Record<string, unknown>): this {
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
        const { updateExpression, attributeNames, attributeValues } =
            this.buildUpdateExpression();

        // Estimate size for Update
        // Update size is basically keys + attribute values.
        const size = calculateItemSize({ ...keys, ...attributeValues });
        if (size > 400 * 1024) {
            throw new ItemSizeExceededError(`Estimated update size of ${Math.round(size / 1024)}KB exceeds the 400KB limit.`);
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: keys,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames:
                Object.keys(attributeNames).length > 0
                    ? attributeNames
                    : undefined,
            ExpressionAttributeValues:
                Object.keys(attributeValues).length > 0
                    ? attributeValues
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

    private buildUpdateExpression() {
        const attributeNames: Record<string, string> = {};
        const attributeValues: Record<string, unknown> = {};
        const updateExpressions: string[] = [];
        let placeholderCounter = 0;

        const getPlaceholders = (key: string) => {
            const id = placeholderCounter++;
            const namePlaceholder = `#n${id}`;
            const valuePlaceholder = `:v${id}`;
            attributeNames[namePlaceholder] = key;
            return { namePlaceholder, valuePlaceholder };
        };

        if (Object.keys(this._setValues).length > 0) {
            const setParts: string[] = [];
            for (const [key, value] of Object.entries(this._setValues)) {
                const { namePlaceholder, valuePlaceholder } =
                    getPlaceholders(key);
                attributeValues[valuePlaceholder] = value;
                setParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
            }
            updateExpressions.push(`SET ${setParts.join(", ")}`);
        }

        if (Object.keys(this._addValues).length > 0) {
            const addParts: string[] = [];
            for (const [key, value] of Object.entries(this._addValues)) {
                const { namePlaceholder, valuePlaceholder } =
                    getPlaceholders(key);
                attributeValues[valuePlaceholder] = value;
                addParts.push(`${namePlaceholder} ${valuePlaceholder}`);
            }
            updateExpressions.push(`ADD ${addParts.join(", ")}`);
        }

        if (this._removeValues.length > 0) {
            const removeParts: string[] = [];
            for (const field of this._removeValues) {
                const id = placeholderCounter++;
                const namePlaceholder = `#n${id}`;
                attributeNames[namePlaceholder] = field;
                removeParts.push(namePlaceholder);
            }
            updateExpressions.push(`REMOVE ${removeParts.join(", ")}`);
        }

        if (Object.keys(this._deleteValues).length > 0) {
            const deleteParts: string[] = [];
            for (const [key, value] of Object.entries(this._deleteValues)) {
                const { namePlaceholder, valuePlaceholder } =
                    getPlaceholders(key);
                attributeValues[valuePlaceholder] = value;
                deleteParts.push(`${namePlaceholder} ${valuePlaceholder}`);
            }
            updateExpressions.push(`DELETE ${deleteParts.join(", ")}`);
        }

        return {
            updateExpression: updateExpressions.join(" "),
            attributeNames,
            attributeValues,
        };
    }
}
