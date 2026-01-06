import { describe, it, expect } from "vitest";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle, DynamoDB } from "../src/utils/db";

const client = new DynamoDBClient({
    region: "us-east-1",
});

describe("Relational Initialization", () => {
    it("should initialize with a direct client (legacy)", () => {
        const db = mizzle(client);
        expect(db).toBeInstanceOf(DynamoDB);
    });

    it("should initialize with a config object", () => {
        const db = mizzle({ client });
        expect(db).toBeInstanceOf(DynamoDB);
    });

    it("should initialize with relations", () => {
        const relations = {
            users: {
                /* mock entity */
            },
        };
        const db = mizzle({ client, relations });
        expect(db).toBeInstanceOf(DynamoDB);
        // @ts-ignore - query will be tested later
        expect(db.query).toBeDefined();
    });
});
