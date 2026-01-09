import { describe, it, expect, vi } from "vitest";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string, number } from "mizzle/columns";
import { prefixKey, staticKey } from "mizzle";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle/db";
import { eq } from "../../packages/mizzle/src/expressions/operators";

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

        const db = mizzle(client);
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
        expect(call.input.UpdateExpression).toContain("#up_n0 = :up_v0");
        expect(call.input.UpdateExpression).toContain("#up_n1 = :up_v1");
        expect(call.input.ExpressionAttributeNames).toEqual({
            "#up_n0": "name",
            "#up_n1": "age",
            "#up_n2": "id",
        });
        expect(call.input.ExpressionAttributeValues).toMatchObject({
            ":up_v0": "John",
            ":up_v1": 30,
            ":up_v2": "123",
        });
    });

    it("should correctly construct ADD expression for numbers and sets", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: { age: 31 } }),
        } as any;

        const db = mizzle(client);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .add({ age: 1 })
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("ADD #up_n0 :up_v0");
        expect(call.input.ExpressionAttributeNames).toEqual({ "#up_n0": "age", "#up_n1": "id" });
        expect(call.input.ExpressionAttributeValues).toEqual({ ":up_v0": 1, ":up_v1": "123" });
    });

    it("should correctly construct REMOVE expression", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: {} }),
        } as any;

        const db = mizzle(client);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .remove("age", "name")
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("REMOVE #up_n0, #up_n1");
        expect(call.input.ExpressionAttributeNames).toEqual({
            "#up_n0": "age",
            "#up_n1": "name",
            "#up_n2": "id",
        });
    });

    it("should correctly construct DELETE expression", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: {} }),
        } as any;

        const db = mizzle(client);
        (db as any).docClient = mockDocClient;

        await db.update(user)
            .delete({ tags: new Set(["tag1"]) })
            .where(eq(user.id, "123"))
            .execute();

        expect(mockDocClient.send).toHaveBeenCalled();
        const call = mockDocClient.send.mock.calls[0][0];
        expect(call.input.UpdateExpression).toContain("DELETE #up_n0 :up_v0");
        expect(call.input.ExpressionAttributeNames).toEqual({ "#up_n0": "tags", "#up_n1": "id" });
        expect(call.input.ExpressionAttributeValues).toEqual({ ":up_v0": new Set(["tag1"]), ":up_v1": "123" });
    });

    it("should correctly handle returning() and ReturnValues", async () => {
        const mockDocClient = {
            send: vi.fn().mockResolvedValue({ Attributes: { name: "John", age: 30 } }),
        } as any;

        const db = mizzle(client);
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

        const db = mizzle(client);
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
