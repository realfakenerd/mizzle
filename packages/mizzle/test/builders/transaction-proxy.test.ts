import { describe, it, expect, vi } from "vitest";
import {
  TransactionProxy,
  ConditionCheckBuilder,
} from "@aurios/mizzle/builders/transaction";
import { InsertBuilder } from "@aurios/mizzle/builders/insert";
import { UpdateBuilder } from "@aurios/mizzle/builders/update";
import { DeleteBuilder } from "@aurios/mizzle/builders/delete";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { string } from "@aurios/mizzle/columns";
import type { IMizzleClient } from "@aurios/mizzle/core/client";

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
