import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import { Column } from "./column";
import {
    BinaryExpression,
    LogicalExpression,
    type Expression,
} from "../expressions/operators";
import { Entity } from "./table";

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
    acc: Record<string, any>
): void {
    if (expression instanceof BinaryExpression) {
        if (expression.operator === "=") {
            acc[expression.column.name] = expression.value;
        }
    } else if (expression instanceof LogicalExpression) {
        if (expression.operator === "AND") {
            for (const condition of expression.conditions) {
                extracValuesFromExpression(condition, acc);
            }
        }
    }
}

function resolveKeyStrategy(
    strategy: KeyStrategy,
    availableValues: Record<string, any>,
): string | undefined {
    if (strategy.type === "static") {
        return strategy.segments[0] as string;
    }

    if (strategy.segments.length === 0) return undefined;

    // Optimization: Pre-calculate size or avoid push if possible, 
    // but joining is inevitable for composite keys.
    // However, we can fail fast.
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
    return undefined;
}

export interface StrategyResolution {
    keys: Record<string, any>;
    hasPartitionKey: boolean;
    hasSortKey: boolean;
    indexName?: string;
}

export function resolveStrategies(
    entity: Entity,
    whereClause?: Expression,
    providedValues?: Record<string, any>,
    forcedIndexName?: string
): StrategyResolution {
    const strategies = entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as Record<string, KeyStrategy>;
    const physicalTable = entity[ENTITY_SYMBOLS.PHYSICAL_TABLE] as any;

    const pkCol = physicalTable[TABLE_SYMBOLS.PARTITION_KEY] as Column;
    const skCol = physicalTable[TABLE_SYMBOLS.SORT_KEY] as Column | undefined;

    const availableValues: Record<string, any> = {};
    
    if (whereClause) {
        extracValuesFromExpression(whereClause, availableValues);
    }
    
    if (providedValues) {
        // providedValues take precedence or merge? 
        // Previously: { ...extracted, ...provided } -> provided overwrites.
        for (const key in providedValues) {
            availableValues[key] = providedValues[key];
        }
    }

    const result: StrategyResolution = {
        keys: {},
        hasPartitionKey: false,
        hasSortKey: false,
    };

    if (forcedIndexName) {
        const indexes = physicalTable[TABLE_SYMBOLS.INDEXES];
        const indexBuilder = indexes?.[forcedIndexName] as any;
        const indexStrategy = strategies[forcedIndexName] as any;

        if (indexBuilder && indexStrategy) {
            const indexPkValue = resolveKeyStrategy(indexStrategy.pk, availableValues);
            if (indexPkValue) {
                result.indexName = forcedIndexName;
                result.keys[indexBuilder.config.pk] = indexPkValue;
                result.hasPartitionKey = true;

                const indexSkValue = indexStrategy.sk ? resolveKeyStrategy(indexStrategy.sk, availableValues) : undefined;
                if (indexSkValue && indexBuilder.config.sk) {
                    result.keys[indexBuilder.config.sk] = indexSkValue;
                    result.hasSortKey = true;
                }
                return result;
            }
        }
    }

    if (strategies.pk) {
        const pkValue = resolveKeyStrategy(strategies.pk, availableValues);
        if (pkValue) {
            result.keys[pkCol.name] = pkValue;
            result.hasPartitionKey = true;
        }
    }

    if (strategies.sk) {
        const skValue = resolveKeyStrategy(strategies.sk, availableValues);
        if (skValue) {
            if (skCol) {
                result.keys[skCol.name] = skValue;
                result.hasSortKey = true;
            }
        }
    } else {
        result.hasSortKey = skCol ? false : true;
    }

    if (!result.hasPartitionKey) {
        const indexes = physicalTable[TABLE_SYMBOLS.INDEXES];
        if (indexes) {
            for (const [indexName, indexBuilderBase] of Object.entries(indexes)) {
                const indexBuilder = indexBuilderBase as any;
                const indexStrategy = strategies[indexName] as any;
                if (!indexStrategy) continue;
                
                if (indexStrategy.pk && indexBuilder.config.pk) {
                    const indexPkValue = resolveKeyStrategy(
                        indexStrategy.pk,
                        availableValues,
                    );

                    if (indexPkValue) {
                        result.indexName = indexName;

                        result.keys = {};
                        result.keys[indexBuilder.config.pk] = indexPkValue;
                        result.hasPartitionKey = true;

                        if (indexStrategy.sk && indexBuilder.config.sk) {
                            const indexSkValue = resolveKeyStrategy(
                                indexStrategy.sk,
                                availableValues,
                            );
                            if (indexSkValue) {
                                result.keys[indexBuilder.config.sk] =
                                    indexSkValue;
                                result.hasSortKey = true;
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