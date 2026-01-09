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
    acc: Record<string, unknown>
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
    availableValues: Record<string, unknown>,
): string | undefined {
    if (strategy.type === "static") {
        return strategy.segments[0] as string;
    }

    if (strategy.segments.length === 0) return undefined;

    if (strategy.type === "prefix" && strategy.segments.length === 2 && typeof strategy.segments[0] === "string" && strategy.segments[1] instanceof Column) {
        const prefix = strategy.segments[0];
        const col = strategy.segments[1];
        const val = availableValues[col.name];
        if (val === undefined || val === null) return undefined;
        const strVal = String(val);
        if (strVal.startsWith(prefix)) return strVal;
        return prefix + strVal;
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
    return undefined;
}

export interface StrategyResolution {
    keys: Record<string, unknown>;
    hasPartitionKey: boolean;
    hasSortKey: boolean;
    indexName?: string;
}

export function resolveStrategies(
    entity: Entity,
    whereClause?: Expression,
    providedValues?: Record<string, unknown>,
    forcedIndexName?: string
): StrategyResolution {
    const strategies = entity[ENTITY_SYMBOLS.ENTITY_STRATEGY] as Record<string, { pk: KeyStrategy, sk?: KeyStrategy }>;
    const physicalTable = entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];

    const pkCol = physicalTable[TABLE_SYMBOLS.PARTITION_KEY] as Column;
    const skCol = physicalTable[TABLE_SYMBOLS.SORT_KEY] as Column | undefined;

    const availableValues: Record<string, unknown> = {};
    const columns = entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, Column>;

    if (providedValues) {
        for (const [key, val] of Object.entries(providedValues)) {
            if (columns[key]) {
                availableValues[key] = val;
            } else {
                const logicalEntry = Object.entries(columns).find(([_, c]) => c.name === key);
                if (logicalEntry) {
                    availableValues[logicalEntry[0]] = val;
                } else {
                    availableValues[key] = val;
                }
            }
        }
    }
    
    if (whereClause) {
        extracValuesFromExpression(whereClause, availableValues);
    }

    const result: StrategyResolution = {
        keys: {},
        hasPartitionKey: false,
        hasSortKey: false,
    };

    if (forcedIndexName) {
        const indexes = physicalTable[TABLE_SYMBOLS.INDEXES];
        const indexBuilder = indexes?.[forcedIndexName] as { config: { pk: string; sk?: string } } | undefined;
        const indexStrategy = strategies[forcedIndexName];

        if (indexBuilder && indexStrategy) {
            // Check if availableValues already contains the PHYSICAL key
            if (availableValues[indexBuilder.config.pk] !== undefined) {
                result.indexName = forcedIndexName;
                result.keys[indexBuilder.config.pk] = availableValues[indexBuilder.config.pk];
                result.hasPartitionKey = true;
                if (indexBuilder.config.sk && availableValues[indexBuilder.config.sk] !== undefined) {
                    result.keys[indexBuilder.config.sk] = availableValues[indexBuilder.config.sk];
                    result.hasSortKey = true;
                }
                return result;
            }

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

    // Check for PHYSICAL keys directly first
    if (availableValues[pkCol.name] !== undefined) {
        result.keys[pkCol.name] = availableValues[pkCol.name];
        result.hasPartitionKey = true;
        if (skCol && availableValues[skCol.name] !== undefined) {
            result.keys[skCol.name] = availableValues[skCol.name];
            result.hasSortKey = true;
        } else if (!skCol) {
            result.hasSortKey = true;
        }
        if (result.hasPartitionKey) return result;
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
                const indexBuilder = indexBuilderBase as { config: { pk: string; sk?: string } };
                const indexStrategy = strategies[indexName];
                if (!indexStrategy) continue;
                
                if (availableValues[indexBuilder.config.pk] !== undefined) {
                    result.indexName = indexName;
                    result.keys = {};
                    result.keys[indexBuilder.config.pk] = availableValues[indexBuilder.config.pk];
                    result.hasPartitionKey = true;
                    if (indexBuilder.config.sk && availableValues[indexBuilder.config.sk] !== undefined) {
                        result.keys[indexBuilder.config.sk] = availableValues[indexBuilder.config.sk];
                        result.hasSortKey = true;
                    }
                    break;
                }

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
