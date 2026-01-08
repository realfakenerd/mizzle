import { bench, describe, beforeAll, afterAll, type BenchOptions } from "vitest";
import { AWSSDKBench } from "./sdk-bench";
import { MizzleBench } from "./mizzle-bench";
import { DynamooseBench } from "./dynamoose-bench";
import { ElectroDBBench } from "./electrodb-bench";
import { DataGenerator } from "./data-gen";
import { createTable, deleteTable, waitForTable } from "./setup";

// Initialize competitors at top level to avoid undefined errors during Vitest warmup
const sdk = new AWSSDKBench();
const mizzle = new MizzleBench();
const dynamoose = new DynamooseBench();
const electrodb = new ElectroDBBench();
const gen = new DataGenerator();
const item = gen.generateBatch(1)[0]!;

const benchOptions: BenchOptions = {
    time: 1000,
    warmupTime: 200,
    warmupIterations: 5,
    throws: true,
    iterations: 1000
};

describe("DynamoDB ORM Benchmarks", () => {
    beforeAll(async () => {
        try {
            await deleteTable();
            await createTable();
            await waitForTable();
        } catch (e) {
            console.error("Setup failed:", e);
        }
    });

    afterAll(async () => {
        try {
            await deleteTable();
        } catch (e) {
            // ignore
        }
    });

    describe("PutItem", () => {
        bench("AWS SDK v3", async () => {
            await sdk.putItem(item);
        }, benchOptions);

        bench("Mizzle", async () => {
            await mizzle.putItem(item);
        }, benchOptions);

        bench("Dynamoose", async () => {
            await dynamoose.putItem(item);
        }, benchOptions);

        bench("ElectroDB", async () => {
            await electrodb.putItem(item);
        }, benchOptions);
    });

    describe("GetItem", () => {
        bench("AWS SDK v3", async () => {
            await sdk.getItem(item.pk, item.sk);
        }, benchOptions);

        bench("Mizzle", async () => {
            await mizzle.getItem(item.pk, item.sk);
        }, benchOptions);

        bench("Dynamoose", async () => {
            await dynamoose.getItem(item.pk, item.sk);
        }, benchOptions);

        bench("ElectroDB", async () => {
            await electrodb.getItem(item.pk, item.sk);
        }, benchOptions);
    });

    describe("UpdateItem", () => {
        bench("AWS SDK v3", async () => {
            await sdk.updateItem(item.pk, item.sk, { name: "Updated Name" });
        }, benchOptions);

        bench("Mizzle", async () => {
            await mizzle.updateItem(item.pk, item.sk, { name: "Updated Name" });
        }, benchOptions);

        bench("Dynamoose", async () => {
            await dynamoose.updateItem(item.pk, item.sk, { name: "Updated Name" });
        }, benchOptions);

        bench("ElectroDB", async () => {
            await electrodb.updateItem(item.pk, item.sk, { name: "Updated Name" });
        }, benchOptions);
    });

    describe("Query", () => {
        bench("AWS SDK v3", async () => {
            await sdk.queryItems(item.pk);
        }, benchOptions);

        bench("Mizzle", async () => {
            await mizzle.queryItems(item.pk);
        }, benchOptions);

        bench("Dynamoose", async () => {
            await dynamoose.queryItems(item.pk);
        }, benchOptions);

        bench("ElectroDB", async () => {
            await electrodb.queryItems(item.pk);
        }, benchOptions);
    });
});
