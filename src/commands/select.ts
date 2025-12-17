import { GetCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { Column } from "../column";
import { entityKind } from "../entity";
import type { SelectedFields as SelectedFieldsBase } from "../operations";
import type { Expression } from "../operators";
import { QueryPromise } from "../query-promise";
import { resolveStrategies } from "../strategies";
import { Entity, PhysicalTable, type InferSelectModel } from "../table";

export type SelectedFields = SelectedFieldsBase<Column, PhysicalTable>;

export class SelectBuilder<TSelection extends SelectedFields | undefined> {
    constructor(
        private client: DynamoDBDocumentClient,
        private fields?: TSelection,
    ) {}

    from<TEntity extends Entity>(entity: TEntity) {
        return new SelectBase(entity, this.client, this.fields);
    }
}

class SelectBase<
    TEntity extends Entity,
    TSelection extends SelectedFields | undefined = undefined,
    TResult = TSelection extends undefined ? InferSelectModel<TEntity> : any,
> extends QueryPromise<TResult> {
    static readonly [entityKind]: string = "SelectBase";

    private whereClause?: Expression;

    constructor(
        private entity: TEntity,
        private client: DynamoDBDocumentClient,
        private fields?: TSelection,
    ) {
        super();
    }

    where(expression: Expression): this {
        this.whereClause = expression;
        return this;
    }

    override async execute(): Promise<TResult> {
        const physicalTable = this.entity[Entity.Symbol.PhysicalTableSymbol];
        const tableName = physicalTable[PhysicalTable.Symbol.TableName];

        const { keys, hasPk, hasSk, indexName } = resolveStrategies(
            this.entity,
            this.whereClause,
        );

        if (hasPk && hasSk && !indexName) {
            let projectionExpression: string | undefined = undefined;
            let expressionAttributeNames: Record<string, string> | undefined =
                undefined;

            if (this.fields) {
            }

            const command = new GetCommand({
                TableName: tableName,
                Key: keys,
                ProjectionExpression: projectionExpression,
                ExpressionAttributeNames: expressionAttributeNames,
            });

            const result = await this.client.send(command);
            return result.Item as TResult;
        }

        throw new Error(
            "Mizzle: Could not resolve Primary Key from 'where' clause. Query/Scan operations are not fully implemented yet, please provide enough fields to form the full Primary Key (GetItem).",
        );
    }
}
