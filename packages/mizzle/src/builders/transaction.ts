import { Entity } from "../core/table";
import { InsertBuilder } from "./insert";
import { UpdateBuilder } from "./update";
import { DeleteBuilder } from "./delete";
import { Expression } from "../expressions/operators";
import { BaseBuilder } from "./base";
import { IMizzleClient } from "../core/client";
import { ENTITY_SYMBOLS } from "@mizzle/shared";

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
