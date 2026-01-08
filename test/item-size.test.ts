import { describe, it, expect } from "vitest";
import { calculateItemSize } from "mizzle/core/validation";

describe("calculateItemSize", () => {
    it("should calculate size of a simple item", () => {
        const item = {
            pk: "USER#1",
            name: "John Doe"
        };
        // pk (2) + USER#1 (6) + name (4) + John Doe (8) = 20
        expect(calculateItemSize(item)).toBe(20);
    });

    it("should handle numbers and booleans", () => {
        const item = {
            age: 30,
            active: true
        };
        // age (3) + 21 (number max) + active (6) + 1 (bool) = 31
        expect(calculateItemSize(item)).toBe(31);
    });

    it("should handle lists", () => {
        const item = {
            tags: ["a", "b"]
        };
        // tags (4) + [3 overhead + a(1) + b(1)] = 4 + 5 = 9
        expect(calculateItemSize(item)).toBe(9);
    });

    it("should handle maps", () => {
        const item = {
            meta: { key: "val" }
        };
        // meta (4) + [3 overhead + key(3) + val(3)] = 4 + 9 = 13
        expect(calculateItemSize(item)).toBe(13);
    });

    it("should accurately estimate large items", () => {
        const largeString = "x".repeat(100 * 1024); // 100KB
        const item = {
            data: largeString
        };
        // data (4) + 102400 = 102404
        expect(calculateItemSize(item)).toBe(102404);
    });
});
