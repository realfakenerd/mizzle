import { Entity } from "electrodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TABLE_NAME, ENDPOINT, REGION } from "./env";
import type { BenchmarkItem } from "./data-gen";

const client = new DynamoDBClient({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

export class ElectroDBBench {
    private UserEntity: any;

    constructor() {
        const tableName = process.env.MIZZLE_BENCH_TABLE || TABLE_NAME;
        this.UserEntity = new Entity({
            model: {
                entity: "user",
                version: "1",
                service: "benchmark"
            },
            attributes: {
                id: {
                    type: "string",
                    required: true,
                },
                sk_val: {
                    type: "string",
                    required: true,
                },
                name: {
                    type: "string",
                },
                email: {
                    type: "string",
                },
                age: {
                    type: "number",
                },
                active: {
                    type: "boolean",
                },
                createdAt: {
                    type: "string",
                },
                payload: {
                    type: "string",
                },
            },
            indexes: {
                primary: {
                    pk: {
                        field: "pk",
                        composite: ["id"],
                        template: "${id}"
                    },
                    sk: {
                        field: "sk",
                        composite: ["sk_val"],
                        template: "${sk_val}"
                    }
                }
            }
        }, { client, table: tableName });
    }

    async putItem(item: BenchmarkItem): Promise<void> {
        // item.pk is "USER#1", item.sk is "METADATA"
        await this.UserEntity.put({
            id: item.pk,
            sk_val: item.sk,
            name: item.name,
            email: item.email,
            age: item.age,
            active: item.active,
            createdAt: item.createdAt,
            payload: item.payload,
        }).go();
    }

    async getItem(pk: string, sk: string): Promise<BenchmarkItem | undefined> {
        const { data } = await this.UserEntity.get({ id: pk, sk_val: sk }).go();
        if (!data) return undefined;
        return {
            pk: data.id,
            sk: data.sk_val,
            name: data.name!,
            email: data.email!,
            age: data.age!,
            active: data.active!,
            createdAt: data.createdAt!,
            payload: data.payload!,
        };
    }

    async updateItem(pk: string, sk: string, updates: Partial<BenchmarkItem>): Promise<void> {
        await this.UserEntity.update({ id: pk, sk_val: sk }).set(updates).go();
    }

    async deleteItem(pk: string, sk: string): Promise<void> {
        await this.UserEntity.delete({ id: pk, sk_val: sk }).go();
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const { data } = await this.UserEntity.query.primary({ id: pk }).go();
        return data.map((item: any) => ({
            pk: item.id,
            sk: item.sk_val,
            name: item.name!,
            email: item.email!,
            age: item.age!,
            active: item.active!,
            createdAt: item.createdAt!,
            payload: item.payload!,
        }));
    }

    async scanItems(): Promise<BenchmarkItem[]> {
        const { data } = await this.UserEntity.scan.go();
        return data.map((item: any) => ({
            pk: item.id,
            sk: item.sk_val,
            name: item.name!,
            email: item.email!,
            age: item.age!,
            active: item.active!,
            createdAt: item.createdAt!,
            payload: item.payload!,
        }));
    }
}
