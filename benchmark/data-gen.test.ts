import { describe, it, expect } from "bun:test";
import { DataGenerator } from "./data-gen";

describe("DataGenerator", () => {
    it("should generate a single item with correct schema", () => {
        const gen = new DataGenerator();
        const item = gen.generateItem(1);

        expect(item).toHaveProperty("pk");
        expect(item).toHaveProperty("sk");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("email");
        expect(item).toHaveProperty("age");
        expect(item).toHaveProperty("active");
        
        expect(typeof item.pk).toBe("string");
        expect(typeof item.sk).toBe("string");
        expect(item.pk).toBe("USER#1");
        expect(item.sk).toBe("METADATA");
    });

    it("should generate a batch of items", () => {
        const gen = new DataGenerator();
        const count = 100;
        const items = gen.generateBatch(count);

        expect(items).toHaveLength(count);
        expect(items[0].pk).toBe("USER#1");
        expect(items[99].pk).toBe("USER#100");
    });

    it("should generate consistent data for same index", () => {
        const gen = new DataGenerator();
        const item1 = gen.generateItem(5);
        const item2 = gen.generateItem(5);

        expect(item1).toEqual(item2);
    });
});
