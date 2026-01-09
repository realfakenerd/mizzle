import { type IMizzleClient } from "../core/client";
import { Entity } from "../core/table";
import { QueryPromise } from "./query-promise";
import { resolveTableName, mapToLogical } from "@mizzle/shared";
import { resolveStrategies, type StrategyResolution } from "../core/strategies";
import { type Expression } from "../expressions/operators";
import { ENTITY_SYMBOLS } from "@mizzle/shared";

export abstract class BaseBuilder<
    TEntity extends Entity,
    TResult,
> extends QueryPromise<TResult> {
    constructor(
        protected readonly entity: TEntity,
        protected readonly client: IMizzleClient,
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
        providedValues?: Record<string, unknown>,
    ): StrategyResolution {
        return resolveStrategies(this.entity, whereClause, providedValues);
    }

    protected createExpressionContext(prefix = "") {
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, unknown> = {};
        let nameCount = 0;
        let valueCount = 0;

        const addName = (name: string) => {
            const segments = name.split(".");
            const placeholders = segments.map(segment => {
                // Check if we already mapped this name segment to avoid redundancy?
                // Actually, simple counter is fine for now and safer against collisions.
                const placeholder = `#${prefix}n${nameCount++}`;
                expressionAttributeNames[placeholder] = segment;
                return placeholder;
            });
            return placeholders.join(".");
        };

        const addValue = (value: unknown) => {
            const placeholder = `:${prefix}v${valueCount++}`;
            expressionAttributeValues[placeholder] = value;
            return placeholder;
        };

        return {
            expressionAttributeNames,
            expressionAttributeValues,
            addName,
            addValue,
        };
    }

    protected mapToLogical(item: Record<string, unknown>): Record<string, unknown> {
        return mapToLogical(this.entity, item);
    }
}
