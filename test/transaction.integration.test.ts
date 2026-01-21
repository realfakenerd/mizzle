import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { string, number } from "@aurios/mizzle/columns";
import { prefixKey, staticKey, add, eq, and } from "@aurios/mizzle";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "@aurios/mizzle/db";
import { TransactionFailedError } from "@aurios/mizzle";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

describe("Transaction Integration", () => {
    const table1Name = "TransactionTable1";
    const table2Name = "TransactionTable2";

    const table1 = dynamoTable(table1Name, { pk: string("pk"), sk: string("sk") });
    const table2 = dynamoTable(table2Name, { pk: string("pk"), sk: string("sk") });

    const user = dynamoEntity(table1, "User", { id: string(), name: string(), balance: number() }, (cols) => ({
        pk: prefixKey("U#", cols.id),
        sk: staticKey("METADATA"),
    }));

    const audit = dynamoEntity(table2, "Audit", { id: string(), action: string(), timestamp: number() }, (cols) => ({
        pk: prefixKey("A#", cols.id),
        sk: staticKey("LOG"),
    }));

    beforeAll(async () => {
        const createTable = async (name: string) => {
            try {
                await client.send(new CreateTableCommand({
                    TableName: name,
                    KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }, { AttributeName: "sk", KeyType: "RANGE" }],
                    AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }, { AttributeName: "sk", AttributeType: "S" }],
                    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
                }));
            } catch { /* ignore */ }
        };
        await createTable(table1Name);
        await createTable(table2Name);
    });

    afterAll(async () => {
        const deleteTable = async (name: string) => {
            try { await client.send(new DeleteTableCommand({ TableName: name })); } catch { /* ignore */ }
        };
        await deleteTable(table1Name);
        await deleteTable(table2Name);
    });

    it("should perform a successful multi-table transaction", async () => {
        const db = mizzle(client);
        const token = `token-${Date.now()}`;

        await db.transaction(token, (tx) => [
            tx.insert(user).values({ id: "user1", name: "Luke", balance: 100 }),
            tx.insert(audit).values({ id: "audit1", action: "signup", timestamp: Date.now() })
        ]);

        const userRes = await db.select().from(user).where(eq(user.id, "user1"));
        const auditRes = await db.select().from(audit).where(eq(audit.id, "audit1"));

        expect(userRes[0]).toMatchObject({ id: "user1", name: "Luke", balance: 100 });
        expect(auditRes[0]).toMatchObject({ id: "audit1", action: "signup" });
    });

    it("should perform a successful atomic update across items", async () => {
        const db = mizzle(client);
        const token = `token-update-${Date.now()}`;

        // Initial state
        await db.insert(user).values({ id: "user2", name: "Leia", balance: 50 }).execute();

        await db.transaction(token, (tx) => [
            tx.update(user).set({ balance: add(50) }).where(eq(user.id, "user2")),
            tx.insert(audit).values({ id: "audit2", action: "credit", timestamp: Date.now() })
        ]);

        const userRes = await db.select().from(user).where(eq(user.id, "user2"));
        expect(userRes[0]!.balance).toBe(100);
    });

    it("should throw TransactionFailedError on conditional check failure", async () => {
        const db = mizzle(client);
        const token = `token-fail-${Date.now()}`;

        // Initial state
        await db.insert(user).values({ id: "user3", name: "Han", balance: 50 }).execute();

        try {
            await db.transaction(token, (tx) => [
                tx.update(user).set({ balance: 100 }).where(and(eq(user.id, "user3"), eq(user.balance, 999))), // Force fail: balance is 50, not 999
                tx.insert(audit).values({ id: "audit3", action: "failed", timestamp: Date.now() })
            ]);
            expect.fail("Should have thrown TransactionFailedError");
        } catch (e) {
            expect(e).toBeInstanceOf(TransactionFailedError);
            const txErr = e as TransactionFailedError;
            expect(txErr.reasons).toHaveLength(1);
            expect(txErr.reasons[0]!.index).toBe(0);
            expect(txErr.reasons[0]!.code).toBe("ConditionalCheckFailed");
        }

        // Verify no changes were made
        const userRes = await db.select().from(user).where(eq(user.id, "user3"));
        expect(userRes[0]!.balance).toBe(50);
        
        const auditRes = await db.select().from(audit).where(eq(audit.id, "audit3"));
        expect(auditRes).toHaveLength(0);
    });
});
