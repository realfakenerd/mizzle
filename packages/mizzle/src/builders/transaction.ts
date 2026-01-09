import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { Entity } from "../core/table";
import { InsertBuilder, InsertBase } from "./insert";
import { UpdateBuilder } from "./update";
import { DeleteBuilder } from "./delete";
import { Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";
import { IMizzleClient } from "../core/client";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { buildExpression } from "../expressions/builder";
import { buildUpdateExpressionString } from "../expressions/update-builder";

export class ConditionCheckBuilder<TEntity extends Entity> extends BaseBuilder<TEntity, void> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "ConditionCheckBuilder";

    private _whereClause?: Expression;

    constructor(entity: TEntity, client: IMizzleClient) {
        super(entity, client);
    }

    where(expression: Expression): this {
        this._whereClause = expression;
        return this;
    }

    override async execute(): Promise<void> {
        throw new Error("ConditionCheckBuilder cannot be executed directly. Use it within a transaction.");
    }

    /** @internal */
    get whereClause() {
        return this._whereClause;
    }

    /** @internal */
    public override createExpressionContext(prefix = "") {
        return super.createExpressionContext(prefix);
    }

    /** @internal */
    public override resolveKeys(
        whereClause?: Expression,
        providedValues?: Record<string, unknown>,
    ) {
        return super.resolveKeys(whereClause, providedValues);
    }
}

export class TransactionProxy {
    constructor(private client: IMizzleClient) {}

    insert<TEntity extends Entity>(entity: TEntity): InsertBuilder<TEntity> {
        return new InsertBuilder(entity, this.client);
    }

    update<TEntity extends Entity>(entity: TEntity): UpdateBuilder<TEntity> {
        return new UpdateBuilder(entity, this.client);
    }

    delete<TEntity extends Entity>(entity: TEntity, keys: Record<string, unknown>): DeleteBuilder<TEntity> {
        return new DeleteBuilder(entity, this.client, keys);
    }

    conditionCheck<TEntity extends Entity>(entity: TEntity): ConditionCheckBuilder<TEntity> {
        return new ConditionCheckBuilder(entity, this.client);
    }
}

export class TransactionExecutor {
    constructor(private client: IMizzleClient) {}

    async execute(token: string, operations: any[]): Promise<void> {
        const transactItems = operations.map(op => this.mapToTransactItem(op));

        const command = new TransactWriteCommand({
            TransactItems: transactItems,
            ClientRequestToken: token,
        });

        await this.client.send(command);
    }

    private mapToTransactItem(builder: any): any {
        const kind = builder.constructor[ENTITY_SYMBOLS.ENTITY_KIND];

        switch (kind) {
            case "InsertBase":
                return { Put: this.mapPut(builder) };
            case "UpdateBuilder":
                return { Update: this.mapUpdate(builder) };
            case "DeleteBuilder":
                return { Delete: this.mapDelete(builder) };
            case "ConditionCheckBuilder":
                return { ConditionCheck: this.mapConditionCheck(builder) };
            default:
                throw new Error(`Unsupported transaction operation: ${kind}`);
        }
    }

    private mapPut(builder: InsertBase<any, any>): any {
        const finalItem = builder.buildItem();

        return {
            TableName: builder.tableName,
            Item: finalItem,
        };
    }

    private mapUpdate(builder: UpdateBuilder<any, any>): any {
        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = builder.createExpressionContext("up_");
        const updateExpression = buildUpdateExpressionString(builder.state, addName, addValue);
        
        let conditionExpression: string | undefined;
        if (builder.whereClause) {
            conditionExpression = buildExpression(builder.whereClause, addName, addValue);
        }

        return {
            TableName: builder.tableName,
            Key: builder.resolveUpdateKeys(),
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        };
    }

    private mapDelete(builder: DeleteBuilder<any, any>): any {
        const resolution = builder.resolveKeys(undefined, builder.keys);
        return {
            TableName: builder.tableName,
            Key: resolution.keys,
        };
    }

    private mapConditionCheck(builder: ConditionCheckBuilder<any>): any {
        const { expressionAttributeNames, expressionAttributeValues, addName, addValue } = builder.createExpressionContext("cc_");
        
        const resolution = builder.resolveKeys(builder.whereClause);
        
        let conditionExpression: string | undefined;
        if (builder.whereClause) {
            conditionExpression = buildExpression(builder.whereClause, addName, addValue);
        }

        return {
            TableName: builder.tableName,
            Key: resolution.keys,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        };
    }
}