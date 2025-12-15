type ConditionOperators =
    | "="
    | "<"
    | "<="
    | ">="
    | ">"
    | "AND"
    | "OR"
    | "begins_with";

export interface Condition {
    type: "binary" | "logical";
    operator?: ConditionOperators;
    column?: string;
    value?: any;
    conditions?: Condition[];
}

type ColRef = string | { name: string };
const getColName = (col: ColRef) => (typeof col === "string" ? col : col.name);

export function eq(column: ColRef, value: any): Condition {
    return { type: "binary", operator: "=", column: getColName(column), value };
}

export function gt(column: ColRef, value: any): Condition {
    return { type: "binary", operator: ">", column: getColName(column), value };
}

export function gte(column: ColRef, value: any): Condition {
    return {
        type: "binary",
        operator: ">=",
        column: getColName(column),
        value,
    };
}

export function lt(column: ColRef, value: any): Condition {
    return { type: "binary", operator: "<", column: getColName(column), value };
}

export function lte(column: ColRef, value: any): Condition {
    return {
        type: "binary",
        operator: "<=",
        column: getColName(column),
        value,
    };
}

export function beginsWith(column: ColRef, value: string): Condition {
    return {
        type: "binary",
        operator: "begins_with",
        column: getColName(column),
        value,
    };
}

export function or(column: ColRef, value: any): Condition {
    return {
        type: "binary",
        operator: "OR",
        column: getColName(column),
        value,
    };
}

export function and(...conditions: Condition[]): Condition {
    return { type: "logical", operator: "AND", conditions };
}

export const operators = {
    eq: eq,
    gt: gt,
    gte: gte,
    lt: lt,
    lte: lte,
    beginsWith: beginsWith,
    and: and,
    or: or,
};

export type Operators = typeof operators;
