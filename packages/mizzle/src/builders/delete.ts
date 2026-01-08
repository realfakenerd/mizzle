import { DeleteCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";

export class DeleteBuilder<
    TEntity extends Entity,
    TResult = InferSelectModel<TEntity>,
> extends BaseBuilder<TEntity, TResult> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "DeleteBuilder";

    private _returnValues?: "NONE" | "ALL_OLD";
    private _keys: Record<string, unknown>;

    constructor(
        entity: TEntity,
        client: DynamoDBDocumentClient,
        keys: Record<string, unknown>,
    ) {
        super(entity, client);
        this._keys = keys;
    }

    returning(): this {
        this._returnValues = "ALL_OLD";
        return this;
    }

    override async execute(): Promise<TResult> {
        const resolution = this.resolveKeys(undefined, this._keys);

        const command = new DeleteCommand({
            TableName: this.tableName,
            Key: resolution.keys,
            ReturnValues: this._returnValues,
        });

        const response = await this.client.send(command);
        return response.Attributes as TResult;
    }
}
