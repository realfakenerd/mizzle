import type { Column } from "./column";

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
