import {
    type Expression,
    BinaryExpression,
    LogicalExpression,
    FunctionExpression,
} from "./operators";

/**
 * Recursively builds a DynamoDB expression string from an Expression object.
 * 
 * @param cond The expression object to build.
 * @param addName A callback to add an attribute name and return its placeholder.
 * @param addValue A callback to add an attribute value and return its placeholder.
 * @param excludeColumns Optional set of physical column names to exclude from the expression.
 * @returns A string suitable for use in ConditionExpression or FilterExpression.
 */
export function buildExpression(
    cond: Expression,
    addName: (name: string) => string,
    addValue: (value: unknown) => string,
    excludeColumns?: Set<string>,
): string | undefined {
    if (cond instanceof LogicalExpression) {
        const parts = cond.conditions
            .map((c) => buildExpression(c, addName, addValue, excludeColumns))
            .filter((p): p is string => p !== undefined && p !== "");
        
        if (parts.length === 0) return undefined;
        if (parts.length === 1) return parts[0];
        return `(${parts.join(` ${cond.operator} `)})`;
    }

    if (cond instanceof BinaryExpression) {
        if (excludeColumns?.has(cond.column.name)) {
            return undefined;
        }
        const colName = addName(cond.column.name);

        if (cond.operator === "between") {
            const valArray = cond.value as unknown[];
            const valKey1 = addValue(valArray[0]);
            const valKey2 = addValue(valArray[1]);
            return `${colName} BETWEEN ${valKey1} AND ${valKey2}`;
        }

        if (cond.operator === "in") {
            const valArray = cond.value as unknown[];
            const valKeys = valArray.map((val) => addValue(val));
            return `${colName} IN (${valKeys.join(", ")})`;
        }

        const valKey = addValue(cond.value);
        return `${colName} ${cond.operator} ${valKey}`;
    }

    if (cond instanceof FunctionExpression) {
        if (excludeColumns?.has(cond.column.name)) {
            return undefined;
        }
        const colName = addName(cond.column.name);

        if (cond.operator === "attribute_exists") {
            return `attribute_exists(${colName})`;
        }

        const valKey = addValue(cond.value);
        return `${cond.operator}(${colName}, ${valKey})`;
    }

    return undefined;
}