import { Column } from "./column";
import {
    BinaryExpression,
    LogicalExpression,
    type Expression,
} from "../expressions/operators";
import { Entity, PhysicalTable } from "./table";

export type KeyStrategyType = "static" | "prefix" | "composite";

export interface KeyStrategy {
    type: KeyStrategyType;
    segments: (string | Column)[];
    separator?: string;
}

/**
 * SK = "METADATA"
 */
export function staticKey(value: string): KeyStrategy {
    return { type: "static", segments: [value] };
}

/**
 * PK = "USER#" + id
 */
export function prefixKey(prefix: string, column: Column): KeyStrategy {
    return { type: "prefix", segments: [prefix, column] };
}

/**
 * SK = "ORDER#" + date + "#STATUS#" + status
 */
export function compositeKey(
    separator: string,
    ...segments: (string | Column)[]
): KeyStrategy {
    return { type: "composite", separator, segments };
}

function extracValuesFromExpression(
    expression: Expression,
): Record<string, any> {
    const foundValues: Record<string, any> = {};

    if (expression instanceof BinaryExpression) {
        if (expression.operator === "=") {
            foundValues[expression.column.name] = expression.value;
        }
    } else if (expression instanceof LogicalExpression) {
        if (expression.operator === "AND") {
            for (const condition of expression.conditions) {
                const childValues = extracValuesFromExpression(condition);
                Object.assign(foundValues, childValues);
            }
        }
    }

    return foundValues;
}

function resolveKeyStrategy(
    strategy: KeyStrategy,
    availableValues: Record<string, any>,
): string | undefined {
    if (strategy.type === "static") {
        return strategy.segments[0] as string;
    }

    const resolvedParts: string[] = [];

    for (const segment of strategy.segments) {
        if (typeof segment === "string") {
            resolvedParts.push(segment);
        } else if (segment instanceof Column) {
            const val = availableValues[segment.name];

            if (val === undefined || val === null) {
                return undefined;
            }

            resolvedParts.push(String(val));
        }
    }

    if (strategy.type === "prefix") {
        return resolvedParts.join("");
    }

    if (strategy.type === "composite") {
        return resolvedParts.join(strategy.separator || "#");
    }
}

export interface StrategyResolution {
    keys: Record<string, any>;
    hasPk: boolean;
    hasSk: boolean;
    indexName?: string;
}

export function resolveStrategies(
    entity: Entity,
    whereClause?: Expression,
    providedValues?: Record<string, any>,
): StrategyResolution {
    const strategies = entity[Entity.Symbol.EntityStrategy];
    const physicalTable = entity[Entity.Symbol.PhysicalTableSymbol];

    const pkCol = physicalTable[PhysicalTable.Symbol.PartitionKey];
    const skCol = physicalTable[PhysicalTable.Symbol.SortKey];

    const availableValues = {
        ...(whereClause ? extracValuesFromExpression(whereClause) : {}),
        ...(providedValues || {}),
    };

    const result: StrategyResolution = {
        keys: {},
        hasPk: false,
        hasSk: false,
    };

    if (strategies.pk) {
        const pkValue = resolveKeyStrategy(strategies.pk, availableValues);
        if (pkValue) {
            result.keys[pkCol.name] = pkValue;
            result.hasPk = true;
        }
    }

    if (strategies.sk) {
        const skValue = resolveKeyStrategy(strategies.sk, availableValues);
        if (skValue) {
            if (skCol) {
                result.keys[skCol.name] = skValue;
                result.hasSk = true;
            }
        }
    } else {
        result.hasSk = skCol ? false : true;
    }

    if (!result.hasPk) {
        const indexes = physicalTable[PhysicalTable.Symbol.Indexes];
        if (indexes) {
            for (const [indexName, indexBuilder] of Object.entries(indexes)) {
                const indexStrategy = strategies[indexName] as any;
                if (!indexStrategy) continue;
                
                // console.log("Checking index:", indexName, indexStrategy);

                if (indexStrategy.pk && indexBuilder.config.pk) {
                    const indexPkValue = resolveKeyStrategy(
                        indexStrategy.pk,
                        availableValues,
                    );

                    if (indexPkValue) {
                        result.indexName = indexName;

                        result.keys = {};
                        result.keys[indexBuilder.config.pk] = indexPkValue;
                        result.hasPk = true;

                        if (indexStrategy.sk && indexBuilder.config.sk) {
                            const indexSkValue = resolveKeyStrategy(
                                indexStrategy.sk,
                                availableValues,
                            );
                            if (indexSkValue) {
                                result.keys[indexBuilder.config.sk] =
                                    indexSkValue;
                                result.hasSk = true;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    return result;
}
