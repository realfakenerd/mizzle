import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { Bench } from "tinybench";
import { AWSSDKBench } from "./sdk-bench";
import { MizzleBench } from "./mizzle-bench";
import { DynamooseBench } from "./dynamoose-bench";
import { ElectroDBBench } from "./electrodb-bench";
import { DataGenerator } from "./data-gen";
import { createTable, deleteTable, waitForTable } from "./setup";

describe("Benchmark Orchestrator", () => {
    beforeAll(async () => {
        await deleteTable();
        await createTable();
        await waitForTable();
    });

    afterAll(async () => {
        await deleteTable();
    });

    test("should initialize all benchmarks", () => {
        const sdk = new AWSSDKBench();
        const mizzle = new MizzleBench();
        const dynamoose = new DynamooseBench();
        const electrodb = new ElectroDBBench();

        expect(sdk).toBeDefined();
        expect(mizzle).toBeDefined();
        expect(dynamoose).toBeDefined();
        expect(electrodb).toBeDefined();
    });

    test("should be able to run a simple tinybench run with all competitors", async () => {
        const sdk = new AWSSDKBench();
        const mizzle = new MizzleBench();
        const dynamoose = new DynamooseBench();
        const electrodb = new ElectroDBBench();
        const gen = new DataGenerator();
        const items = gen.generateBatch(1);
        const item = items[0]!;

        const bench = new Bench({ time: 50, iterations: 10 }); // Very short for testing

        bench
            .add("AWS SDK v3: PutItem", async () => {
                await sdk.putItem(item);
            })
            .add("Mizzle: PutItem", async () => {
                await mizzle.putItem(item);
            })
            .add("Dynamoose: PutItem", async () => {
                await dynamoose.putItem(item);
            })
            .add("ElectroDB: PutItem", async () => {
                await electrodb.putItem(item);
            });

        await bench.run();

        expect(bench.tasks.length).toBe(4);
        expect(bench.tasks.every(task => task.result !== undefined)).toBe(true);
    });
});
