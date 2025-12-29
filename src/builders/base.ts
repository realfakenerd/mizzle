import { type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Entity } from "../core/table";
import { QueryPromise } from "./query-promise";
import { resolveTableName } from "../utils/utils";
import { resolveStrategies, type StrategyResolution } from "../core/strategies";
import { type Expression } from "../expressions/operators";
import { ENTITY_SYMBOLS } from "../constants";

export abstract class BaseBuilder<
    TEntity extends Entity,
    TResult,
> extends QueryPromise<TResult> {
    constructor(
        protected readonly entity: TEntity,
        protected readonly client: DynamoDBDocumentClient,
    ) {
        super();
    }

    protected get tableName(): string {
        return resolveTableName(this.entity);
    }

    protected get physicalTable() {
        return this.entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];
    }

    protected resolveKeys(
        whereClause?: Expression,
        providedValues?: Record<string, any>,
    ): StrategyResolution {
        return resolveStrategies(this.entity, whereClause, providedValues);
    }
}
