import { Column } from "../core/column";

type BinaryOperators = "=" | "<" | "<=" | ">=" | ">";
type LogicalOperators = "AND" | "OR";
type FunctionOperators = "begins_with" | "contains" | "attribute_exists";

export abstract class Expression {
    abstract readonly type: "binary" | "logical" | "function";
}

export class BinaryExpression extends Expression {
    readonly type = "binary";
    constructor(
        readonly column: Column,
        readonly operator: BinaryOperators,
        readonly value: any,
    ) {
        super();
    }
}

export class LogicalExpression extends Expression {
    readonly type = "logical";
    constructor(
        readonly conditions: Expression[],
        readonly operator: LogicalOperators,
    ) {
        super();
    }
}

export class FunctionExpression extends Expression {
    readonly type = "function";
    constructor(
        readonly column: Column,
        readonly operator: FunctionOperators,
        readonly value: any,
    ) {
        super();
    }
}

export function eq(column: Column, value: any) {
    return new BinaryExpression(column, "=", value);
}

export function gt(column: Column, value: any) {
    return new BinaryExpression(column, ">", value);
}

export function gte(column: Column, value: any) {
    return new BinaryExpression(column, ">=", value);
}

export function lt(column: Column, value: any) {
    return new BinaryExpression(column, "<", value);
}

export function lte(column: Column, value: any) {
    return new BinaryExpression(column, "<=", value);
}

export function beginsWith(column: Column, value: string) {
    return new FunctionExpression(column, "begins_with", value);
}

export function contains(column: Column, value: any) {
    return new FunctionExpression(column, "contains", value);
}

export function attributeExists(column: Column, value: any) {
    return new FunctionExpression(column, "attribute_exists", value);
}

export function or(...conditions: Expression[]) {
    return new LogicalExpression(conditions, "OR");
}

export function and(...conditions: Expression[]) {
    return new LogicalExpression(conditions, "AND");
}

export const operators = {
    eq,
    gt,
    gte,
    lt,
    lte,
    and,
    or,
    contains,
    beginsWith,
    attributeExists,
};

export type Operators = typeof operators;
