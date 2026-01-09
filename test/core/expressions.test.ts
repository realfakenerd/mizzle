import { describe, it, expect } from "vitest";
import { buildExpression } from "../../packages/mizzle/src/expressions/builder";
import { eq, lt, and, or, between, inList, beginsWith, attributeExists } from "../../packages/mizzle/src/expressions/operators";
import type { Column } from "../../packages/mizzle/src/core/column";

describe("Expression Builder", () => {
    const colA = { name: "col_a" } as any as Column;
    const colB = { name: "col_b" } as any as Column;

    const addName = (n: string) => `#${n}`;
    const addValue = (v: any) => `:${v}`;

    it("should build simple binary expressions", () => {
        expect(buildExpression(eq(colA, "val"), addName, addValue)).toBe("#col_a = :val");
        expect(buildExpression(lt(colB, 10), addName, addValue)).toBe("#col_b < :10");
    });

    it("should build logical AND expressions", () => {
        const cond = and(eq(colA, "val"), lt(colB, 10));
        expect(buildExpression(cond, addName, addValue)).toBe("(#col_a = :val AND #col_b < :10)");
    });

    it("should build logical OR expressions", () => {
        const cond = or(eq(colA, "val"), lt(colB, 10));
        expect(buildExpression(cond, addName, addValue)).toBe("(#col_a = :val OR #col_b < :10)");
    });

    it("should build BETWEEN expressions", () => {
        const cond = between(colA, [5, 10]);
        expect(buildExpression(cond, addName, addValue)).toBe("#col_a BETWEEN :5 AND :10");
    });

    it("should build IN expressions", () => {
        const cond = inList(colA, ["x", "y", "z"]);
        expect(buildExpression(cond, addName, addValue)).toBe("#col_a IN (:x, :y, :z)");
    });

    it("should build function expressions", () => {
        expect(buildExpression(beginsWith(colA, "pre"), addName, addValue)).toBe("begins_with(#col_a, :pre)");
        expect(buildExpression(attributeExists(colB), addName, addValue)).toBe("attribute_exists(#col_b)");
    });

    it("should respect excludeColumns", () => {
        const exclude = new Set(["col_a"]);
        expect(buildExpression(eq(colA, "val"), addName, addValue, exclude)).toBeUndefined();
        
        const cond = and(eq(colA, "val"), lt(colB, 10));
        // col_a is excluded, so only col_b part remains
        expect(buildExpression(cond, addName, addValue, exclude)).toBe("#col_b < :10");
    });
});
