import * as dynamoose from "dynamoose";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { TABLE_NAME, ENDPOINT, REGION } from "./env";
import type { BenchmarkItem } from "./data-gen";

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

export class DynamooseBench {
    private Model: any;

    constructor() {
        const tableName = process.env.MIZZLE_BENCH_TABLE || TABLE_NAME;
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

        this.Model = dynamoose.model(tableName, schema, {
            create: false, // Table is created by setup.ts
            waitForActive: false,
        });
    }

    async putItem(item: BenchmarkItem): Promise<void> {
        await this.Model.create(item, { overwrite: true });
    }

    async getItem(pk: string, sk: string): Promise<BenchmarkItem | undefined> {
        const result = await this.Model.get({ pk, sk });
        if (!result) return undefined;
        // Dynamoose returns a Document, we need to convert to plain object
        return JSON.parse(JSON.stringify(result)) as BenchmarkItem;
    }

    async updateItem(pk: string, sk: string, updates: Partial<BenchmarkItem>): Promise<void> {
        await this.Model.update({ pk, sk }, updates);
    }

    async deleteItem(pk: string, sk: string): Promise<void> {
        await this.Model.delete({ pk, sk });
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const results = await this.Model.query("pk").eq(pk).exec();
        return JSON.parse(JSON.stringify(results)) as BenchmarkItem[];
    }

    async scanItems(): Promise<BenchmarkItem[]> {
        const results = await this.Model.scan().exec();
        return JSON.parse(JSON.stringify(results)) as BenchmarkItem[];
    }
}
