import { describe, it, expect, vi } from "vitest";
import { TransactionExecutor, ConditionCheckBuilder } from "../../packages/mizzle/src/builders/transaction";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { string, number } from "@aurios/mizzle/columns";
import type { IMizzleClient } from "../../packages/mizzle/src/core/client";
import { mizzle } from "@aurios/mizzle/db";
import { eq, and } from "../../packages/mizzle/src/expressions/operators";
import { add, prefixKey } from "@aurios/mizzle";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe("TransactionExecution Mapping", () => {
    const table = dynamoTable("TestTable", { pk: string("pk"), sk: string("sk") });
    const user = dynamoEntity(table, "User", { id: string(), name: string(), age: number() }, (cols) => ({ 
        pk: prefixKey("U#", cols.id),
        sk: prefixKey("M#", cols.name) 
    }));
    
    const rawClient = new DynamoDBClient({ region: "us-east-1" });
    const mockClient = { send: vi.fn() } as any;
    const db = mizzle(rawClient);
    (db as any).docClient = mockClient;

    it("should map InsertBase to Put item", async () => {
        const executor = new TransactionExecutor(mockClient);
        const op = db.insert(user).values({ id: "1", name: "Luke", age: 30 });
        
        const mapped = (executor as any).mapToTransactItem(op);
        
        expect(mapped).toMatchObject({
            Put: {
                TableName: "TestTable",
                Item: {
                    pk: "U#1",
                    sk: "M#Luke",
                    id: "1",
                    name: "Luke",
                    age: 30
                }
            }
        });
    });

    it("should map UpdateBuilder to Update item", async () => {
        const executor = new TransactionExecutor(mockClient);
        // Both SET and ADD
        const op = db.update(user)
            .set({ name: "Luke Skywalker", age: add(1) })
            .where(and(eq(user.id, "1"), eq(user.name, "Luke")));
        
        const mapped = (executor as any).mapToTransactItem(op);
        
        expect(mapped.Update).toMatchObject({
            TableName: "TestTable",
            Key: { pk: "U#1", sk: "M#Luke" },
        });
        expect(mapped.Update.UpdateExpression).toContain("SET");
        expect(mapped.Update.UpdateExpression).toContain("ADD");
    });

    it("should map DeleteBuilder to Delete item", async () => {
        const executor = new TransactionExecutor(mockClient);
        const op = db.delete(user, { id: "1", name: "Luke" });
        
        const mapped = (executor as any).mapToTransactItem(op);
        
        expect(mapped).toMatchObject({
            Delete: {
                TableName: "TestTable",
                Key: { pk: "U#1", sk: "M#Luke" }
            }
        });
    });

    it("should map ConditionCheckBuilder to ConditionCheck item", async () => {
        const executor = new TransactionExecutor(mockClient);
        const op = new ConditionCheckBuilder(user, mockClient)
            .where(and(eq(user.id, "1"), eq(user.name, "Luke")));
        
        const mapped = (executor as any).mapToTransactItem(op);
        
        expect(mapped).toMatchObject({
            ConditionCheck: {
                TableName: "TestTable",
                Key: { pk: "U#1", sk: "M#Luke" },
            }
        });
        expect(mapped.ConditionCheck.ConditionExpression).toBeDefined();
    });
});
