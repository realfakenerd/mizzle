import * as dynamoose from "dynamoose";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { TABLE_NAME, ENDPOINT, REGION } from "./env";
import { BenchmarkItem } from "./data-gen";

// Configure dynamoose to use local instance
const ddb = new DynamoDB({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});
dynamoose.aws.ddb.set(ddb);

const schema = new dynamoose.Schema({
    pk: {
        type: String,
        hashKey: true,
    },
    sk: {
        type: String,
        rangeKey: true,
    },
    name: String,
    email: String,
    age: Number,
    active: Boolean,
    createdAt: String,
    payload: String,
}, {
    saveUnknown: true,
    timestamps: false,
});

const Model = dynamoose.model(TABLE_NAME, schema, {
    create: false, // Table is created by setup.ts
    waitForActive: false,
});

export class DynamooseBench {
    async putItem(item: BenchmarkItem): Promise<void> {
        await Model.create(item);
    }

    async getItem(pk: string, sk: string): Promise<BenchmarkItem | undefined> {
        const result = await Model.get({ pk, sk });
        if (!result) return undefined;
        // Dynamoose returns a Document, we need to convert to plain object
        return JSON.parse(JSON.stringify(result)) as BenchmarkItem;
    }

    async updateItem(pk: string, sk: string, updates: Partial<BenchmarkItem>): Promise<void> {
        await Model.update({ pk, sk }, updates);
    }

    async deleteItem(pk: string, sk: string): Promise<void> {
        await Model.delete({ pk, sk });
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const results = await Model.query("pk").eq(pk).exec();
        return JSON.parse(JSON.stringify(results)) as BenchmarkItem[];
    }

    async scanItems(): Promise<BenchmarkItem[]> {
        const results = await Model.scan().exec();
        return JSON.parse(JSON.stringify(results)) as BenchmarkItem[];
    }
}
