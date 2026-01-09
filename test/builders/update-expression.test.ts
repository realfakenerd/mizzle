import { describe, it, expect } from "vitest";
import { createUpdateState, partitionUpdateValues, buildUpdateExpressionString } from "../../packages/mizzle/src/expressions/update-builder";
import { add, append, remove, ifNotExists, addToSet, deleteFromSet } from "../../packages/mizzle/src/expressions/actions";

describe("Update Expression Builder", () => {
    it("should partition simple values into SET", () => {
        const state = createUpdateState();
        partitionUpdateValues({ name: "Luke", age: 30 }, state);
        
        expect(state.set).toMatchObject({
            name: { value: "Luke" },
            age: { value: 30 }
        });
    });

    it("should handle add() helper", () => {
        const state = createUpdateState();
        partitionUpdateValues({ loginCount: add(1) }, state);
        
        expect(state.add).toMatchObject({
            loginCount: 1
        });
    });

    it("should handle remove() helper", () => {
        const state = createUpdateState();
        partitionUpdateValues({ temporaryField: remove() }, state);
        
        expect(state.remove).toContain("temporaryField");
    });

    it("should handle append() helper", () => {
        const state = createUpdateState();
        partitionUpdateValues({ tags: append(["new"]) }, state);
        
        expect(state.set.tags).toMatchObject({
            value: ["new"],
            functionName: "list_append",
            usePathAsFirstArg: true
        });
    });

    it("should build a valid UpdateExpression string with reserved words", () => {
        const state = createUpdateState();
        partitionUpdateValues({ 
            name: "Luke", 
            status: "active", 
            loginCount: add(1),
            oldField: remove()
        }, state);

        const names: Record<string, string> = {};
        const values: Record<string, unknown> = {};
        let n = 0, v = 0;
        const addName = (name: string) => {
            const p = `#n${n++}`;
            names[p] = name;
            return p;
        };
        const addValue = (val: unknown) => {
            const p = `:v${v++}`;
            values[p] = val;
            return p;
        };

        const expr = buildUpdateExpressionString(state, addName, addValue);

        expect(expr).toContain("SET #n0 = :v0, #n1 = :v1");
        expect(expr).toContain("ADD #n2 :v2");
        expect(expr).toContain("REMOVE #n3");
        
        expect(names["#n0"]).toBe("name");
        expect(names["#n1"]).toBe("status");
        expect(names["#n2"]).toBe("loginCount");
        expect(names["#n3"]).toBe("oldField");
    });

    it("should handle nested paths in addName", () => {
        // This tests the BaseBuilder refactoring
        const expressionAttributeNames: Record<string, string> = {};
        let nameCount = 0;
        const addName = (name: string) => {
            const segments = name.split(".");
            const placeholders = segments.map(segment => {
                const placeholder = `#n${nameCount++}`;
                expressionAttributeNames[placeholder] = segment;
                return placeholder;
            });
            return placeholders.join(".");
        };

        const path = addName("info.address.city");
        expect(path).toBe("#n0.#n1.#n2");
        expect(expressionAttributeNames["#n0"]).toBe("info");
        expect(expressionAttributeNames["#n1"]).toBe("address");
        expect(expressionAttributeNames["#n2"]).toBe("city");
    });
});
