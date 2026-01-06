import { describe, it, expect } from "vitest";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { dynamoTable, dynamoEntity } from "../packages/mizzle/src/core/table";
import { mizzle } from "../src/utils/db";
import { string } from "../packages/mizzle/src/columns/all";
import { RelationnalQueryBuilder } from "../packages/mizzle/src/builders/relational-builder";

const client = new DynamoDBClient({
    region: "us-east-1",
});

const table = dynamoTable("mizzle-test", {
    pk: string("pk"),
});

const users = dynamoEntity(table, "users", {
    id: string("id"),
});

describe("Relational Query Proxy", () => {
    it("should provide dynamic access to entities via proxy", () => {
        const db = mizzle({
            client,
            relations: {
                users,
            }
        });

        expect(db.query.users).toBeDefined();
        expect(db.query.users).toBeInstanceOf(RelationnalQueryBuilder);
    });

    it("should throw if accessing non-existent entity", () => {
        const db = mizzle({
            client,
            relations: {
                users,
            }
        });

        expect(() => (db.query as any).posts).toThrow(/Entity posts not found/);
    });

    it("should throw if query is accessed but no relations defined", () => {
        const db = mizzle(client);
        expect(() => (db.query as any).users).toThrow(/No relations defined/);
    });
});
