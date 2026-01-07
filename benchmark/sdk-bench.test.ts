import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { AWSSDKBench } from "./sdk-bench";
import { createTable, deleteTable, waitForTable } from "./setup";
import { DataGenerator } from "./data-gen";

describe("AWSSDKBench", () => {
    let bench: AWSSDKBench;
    const gen = new DataGenerator();

    beforeAll(async () => {
        await deleteTable();
        await createTable();
        await waitForTable();
        bench = new AWSSDKBench();
    });

    afterAll(async () => {
        await deleteTable();
    });

    it("should put an item", async () => {
        const item = gen.generateItem(1);
        await bench.putItem(item);
    });

    it("should get an item", async () => {
        const item = await bench.getItem("USER#1", "METADATA");
        expect(item).toBeDefined();
        expect(item!.pk).toBe("USER#1");
    });

    it("should update an item", async () => {
        await bench.updateItem("USER#1", "METADATA", { name: "Updated Name" });
        const item = await bench.getItem("USER#1", "METADATA");
        expect(item!.name).toBe("Updated Name");
    });

    it("should query items", async () => {
        // Seed some data for query
        await bench.putItem(gen.generateItem(2));
        await bench.putItem(gen.generateItem(3));
        
        const items = await bench.queryItems("USER#2");
        expect(items).toHaveLength(1);
        expect(items[0]!.pk).toBe("USER#2");
    });

    it("should scan items", async () => {
        const items = await bench.scanItems();
        expect(items.length).toBeGreaterThanOrEqual(3);
    });

    it("should delete an item", async () => {
        await bench.deleteItem("USER#1", "METADATA");
        const item = await bench.getItem("USER#1", "METADATA");
        expect(item).toBeUndefined();
    });
});
