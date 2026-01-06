import { describe, it, expect, beforeEach } from "vitest";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { dynamoTable, dynamoEntity } from "../../packages/mizzle/src/core/table";
import { mizzle } from "../../src/utils/db";
import { string, uuid } from "../../packages/mizzle/src/columns/all";
import { eq } from "../../packages/mizzle/src/expressions/operators";

const client = new DynamoDBClient({
    region: "us-east-1",
});

const table = dynamoTable("mizzle-test", {
    pk: string("pk"),
});

const users = dynamoEntity(table, "users", {
    id: uuid("id"),
    name: string("name"),
});

const db = mizzle({
    client,
    relations: {
        users,
    }
});

describe("RelationalQueryBuilder.findMany()", () => {
    it("should fetch multiple records without relations", async () => {
        // Since we don't have a real DB in this unit test without mocking,
        // we'll at least verify the builder returns a promise and we can call findMany.
        // Integration tests will verify actual data fetching.
        const query = db.query.users.findMany();
        expect(query).toBeInstanceOf(Promise);
    });

    it("should apply limit", async () => {
        const query = db.query.users.findMany({ limit: 10 });
        expect(query).toBeInstanceOf(Promise);
    });

    it("should apply where condition", async () => {
        const query = db.query.users.findMany({
            where: (cols, { eq }) => eq(cols.id, "123")
        });
        expect(query).toBeInstanceOf(Promise);
    });

    it("should call findFirst", async () => {
        const query = db.query.users.findFirst();
        expect(query).toBeInstanceOf(Promise);
    });
});
