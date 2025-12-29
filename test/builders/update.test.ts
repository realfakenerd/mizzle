import { describe, it, expect, beforeEach, vi } from "vitest";
import { dynamoTable, dynamoEntity } from "../../src/core/table";
import { string, number } from "../../src/columns/all";
import { prefixKey, staticKey } from "../../src/core/strategies";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "../../src/utils/db";
import { eq } from "../../src/expressions/operators";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

describe("Update Builder", () => {
    const table = dynamoTable("TestTable", {
        pk: string("pk"),
        sk: string("sk"),
    });

    const user = dynamoEntity(
        table,
        "User",
        {
            id: string(),
            name: string(),
            age: number(),
        },
        (cols) => ({
            pk: prefixKey("USER#", cols.id),
            sk: staticKey("METADATA"),
        }),
    );

    const db = mizzle(client);

    it("should have a .set() method that allows updating fields", () => {
        const query = db.update(user).set({ name: "John" }).where(eq(user.id, "123"));
        expect(query).toBeDefined();
    });

    it("should correctly resolve keys and construct SET expression", async () => {
        // Mock DynamoDBDocumentClient
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: { name: "John", id: "123" } }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .set({ name: "John", age: 30 })
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.TableName).toBe("TestTable");
        expect(call.input.Key).toEqual({
            pk: "USER#123",
            sk: "METADATA",
        });
        expect(call.input.UpdateExpression).toContain("SET");
        expect(call.input.UpdateExpression).toContain("#name = :name");
        expect(call.input.UpdateExpression).toContain("#age = :age");
        expect(call.input.ExpressionAttributeNames).toEqual({
            "#name": "name",
            "#age": "age",
        });
        expect(call.input.ExpressionAttributeValues).toEqual({
            ":name": "John",
            ":age": 30,
        });
    });

    it("should correctly construct ADD expression for numbers and sets", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: { age: 31 } }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .add({ age: 1 })
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("ADD #age :age");
        expect(call.input.ExpressionAttributeNames).toEqual({ "#age": "age" });
        expect(call.input.ExpressionAttributeValues).toEqual({ ":age": 1 });
    });

    it("should correctly construct REMOVE expression", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: {} }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .remove("age", "name")
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("REMOVE #age, #name");
        expect(call.input.ExpressionAttributeNames).toEqual({
            "#age": "age",
            "#name": "name",
        });
    });

    it("should correctly construct DELETE expression", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: {} }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .delete({ tags: new Set(["tag1"]) })
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("DELETE #tags :tags");
        expect(call.input.ExpressionAttributeNames).toEqual({ "#tags": "tags" });
        expect(call.input.ExpressionAttributeValues).toEqual({ ":tags": new Set(["tag1"]) });
    });

    it("should correctly handle returning() and ReturnValues", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: { name: "John", age: 30 } }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        const result = await db.update(user)
            .set({ name: "John" })
            .where(eq(user.id, "123"))
            .returning("ALL_NEW")
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.ReturnValues).toBe("ALL_NEW");
        expect(result).toEqual({ name: "John", age: 30 });
    });

    it("should allow explicit key provision via key()", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: {} }),
        } as any;

        const db = mizzle({ config: {} } as any);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .set({ name: "John" })
            .key({ pk: "MANUAL#123", sk: "METADATA" })
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.Key).toEqual({
            pk: "MANUAL#123",
            sk: "METADATA",
        });
    });
});
