import { UpdateCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Entity, PhysicalTable, type InferInsertModel } from "../core/table";
import { entityKind } from "../core/entity";
import { QueryPromise } from "./query-promise";
import { type Expression } from "../expressions/operators";
import { resolveStrategies } from "../core/strategies";

export class UpdateBuilder<
    TEntity extends Entity,
    TResult = any,
> extends QueryPromise<TResult> {
    static readonly [entityKind]: string = "UpdateBuilder";

    private _setValues: Partial<InferInsertModel<TEntity>> = {};
    private _addValues: Record<string, any> = {};
    private _removeValues: string[] = [];
    private _deleteValues: Record<string, any> = {};
    private _whereClause?: Expression;
    private _returnValues?: "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW";

    constructor(
        private entity: TEntity,
        private client: DynamoDBDocumentClient,
    ) {
        super();
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

    async execute(): Promise<TResult> {
        const physicalTable = this.entity[Entity.Symbol.PhysicalTableSymbol];
        const tableName = physicalTable[PhysicalTable.Symbol.TableName];

        const { keys } = resolveStrategies(
            this.entity,
            this._whereClause,
        );

        const attributeNames: Record<string, string> = {};
        const attributeValues: Record<string, any> = {};
        const updateExpressions: string[] = [];

        if (Object.keys(this._setValues).length > 0) {
            const setParts: string[] = [];
            for (const [key, value] of Object.entries(this._setValues)) {
                const namePlaceholder = `#${key}`;
                const valuePlaceholder = `:${key}`;
                attributeNames[namePlaceholder] = key;
                attributeValues[valuePlaceholder] = value;
                setParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
            }
            updateExpressions.push(`SET ${setParts.join(", ")}`);
        }

        if (Object.keys(this._addValues).length > 0) {
            const addParts: string[] = [];
            for (const [key, value] of Object.entries(this._addValues)) {
                const namePlaceholder = `#${key}`;
                const valuePlaceholder = `:${key}`;
                attributeNames[namePlaceholder] = key;
                attributeValues[valuePlaceholder] = value;
                addParts.push(`${namePlaceholder} ${valuePlaceholder}`);
            }
            updateExpressions.push(`ADD ${addParts.join(", ")}`);
        }

        if (this._removeValues.length > 0) {
            const removeParts: string[] = [];
            for (const field of this._removeValues) {
                const namePlaceholder = `#${field}`;
                attributeNames[namePlaceholder] = field;
                removeParts.push(namePlaceholder);
            }
            updateExpressions.push(`REMOVE ${removeParts.join(", ")}`);
        }

        if (Object.keys(this._deleteValues).length > 0) {
            const deleteParts: string[] = [];
            for (const [key, value] of Object.entries(this._deleteValues)) {
                const namePlaceholder = `#${key}`;
                const valuePlaceholder = `:${key}`;
                attributeNames[namePlaceholder] = key;
                attributeValues[valuePlaceholder] = value;
                deleteParts.push(`${namePlaceholder} ${valuePlaceholder}`);
            }
            updateExpressions.push(`DELETE ${deleteParts.join(", ")}`);
        }

        const command = new UpdateCommand({
            TableName: tableName,
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
