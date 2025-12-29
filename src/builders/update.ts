import { UpdateCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Entity, type InferInsertModel } from "../core/table";
import { entityKind } from "../core/entity";
import { type Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";

export class UpdateBuilder<
    TEntity extends Entity,
    TResult = any,
> extends BaseBuilder<TEntity, TResult> {
    static readonly [entityKind]: string = "UpdateBuilder";

    private _setValues: Partial<InferInsertModel<TEntity>> = {};
    private _addValues: Record<string, any> = {};
    private _removeValues: string[] = [];
    private _deleteValues: Record<string, any> = {};
    private _whereClause?: Expression;
    private _returnValues?: "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW";
    private _explicitKey?: Record<string, any>;

    constructor(
        entity: TEntity,
        client: DynamoDBDocumentClient,
    ) {
        super(entity, client);
    }

    key(keyObject: Record<string, any>): this {
        this._explicitKey = keyObject;
        return this;
    }

    set(values: Partial<InferInsertModel<TEntity>>): this {
        this._setValues = { ...this._setValues, ...values };
        return this;
    }

    add(values: Record<string, any>): this {
        this._addValues = { ...this._addValues, ...values };
        return this;
    }

    remove(...fields: string[]): this {
        this._removeValues.push(...fields);
        return this;
    }

    delete(values: Record<string, any>): this {
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
        let keys: Record<string, any> | undefined = this._explicitKey;

        if (!keys) {
            const resolved = this.resolveKeys(
                this._whereClause,
            );
            keys = resolved.keys;
        }

        const attributeNames: Record<string, string> = {};
        const attributeValues: Record<string, any> = {};
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
                const { namePlaceholder, valuePlaceholder } = getPlaceholders(key);
                attributeValues[valuePlaceholder] = value;
                setParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
            }
            updateExpressions.push(`SET ${setParts.join(", ")}`);
        }

        if (Object.keys(this._addValues).length > 0) {
            const addParts: string[] = [];
            for (const [key, value] of Object.entries(this._addValues)) {
                const { namePlaceholder, valuePlaceholder } = getPlaceholders(key);
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
                const { namePlaceholder, valuePlaceholder } = getPlaceholders(key);
                attributeValues[valuePlaceholder] = value;
                deleteParts.push(`${namePlaceholder} ${valuePlaceholder}`);
            }
            updateExpressions.push(`DELETE ${deleteParts.join(", ")}`);
        }

        const command = new UpdateCommand({
            TableName: this.tableName,
            Key: keys,
            UpdateExpression: updateExpressions.join(" "),
            ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
            ExpressionAttributeValues: Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
            ReturnValues: this._returnValues,
        });

        const response = await this.client.send(command);
        return response.Attributes as TResult;
    }
}
