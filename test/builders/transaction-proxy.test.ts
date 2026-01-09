import { describe, it, expect, vi } from "vitest";
import { TransactionProxy, ConditionCheckBuilder } from "../../packages/mizzle/src/builders/transaction";
import { InsertBuilder } from "../../packages/mizzle/src/builders/insert";
import { UpdateBuilder } from "../../packages/mizzle/src/builders/update";
import { DeleteBuilder } from "../../packages/mizzle/src/builders/delete";
import { dynamoTable, dynamoEntity } from "mizzle/table";
import { string } from "mizzle/columns";
import { IMizzleClient } from "../../packages/mizzle/src/core/client";

describe("TransactionProxy", () => {
    const table = dynamoTable("TestTable", { pk: string("pk") });
    const user = dynamoEntity(table, "User", { name: string() }, (cols) => ({ pk: cols.name }));
    const mockClient = { send: vi.fn() } as unknown as IMizzleClient;

    it("should return an InsertBuilder", () => {
        const tx = new TransactionProxy(mockClient);
        const builder = tx.insert(user);
        expect(builder).toBeInstanceOf(InsertBuilder);
    });

    it("should return an UpdateBuilder", () => {
        const tx = new TransactionProxy(mockClient);
        const builder = tx.update(user);
        expect(builder).toBeInstanceOf(UpdateBuilder);
    });

    it("should return a DeleteBuilder", () => {
        const tx = new TransactionProxy(mockClient);
        const builder = tx.delete(user, { name: "test" });
        expect(builder).toBeInstanceOf(DeleteBuilder);
    });

    it("should return a ConditionCheckBuilder", () => {
        const tx = new TransactionProxy(mockClient);
        const builder = tx.conditionCheck(user);
        expect(builder).toBeInstanceOf(ConditionCheckBuilder);
    });
});