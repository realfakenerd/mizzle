import { describe, it, expect, vi } from "vitest";
import { date } from "@aurios/mizzle/columns";
import { dynamoTable, dynamoEntity } from "@aurios/mizzle/table";
import { InsertBase, UpdateBuilder, eq, buildExpression } from "@aurios/mizzle";
import type { IMizzleClient } from "../packages/mizzle/src/core/client";

describe("date column", () => {
  it("should define a date column", () => {
    const col = date("created_at");
    const c = col as unknown as { config: { name: string; dataType: string; columnType: string } };
    expect(c.config.name).toBe("created_at");
    expect(c.config.dataType).toBe("date");
    expect(c.config.columnType).toBe("S");
  });

  const table = dynamoTable("test", {
    pk: date("pk").partitionKey(),
  });
  const entity = dynamoEntity(table, "test", {
    pk: date("pk"),
  });
  const col = entity.pk;

  describe("serialization (mapToDynamoValue)", () => {
    it("should serialize Date objects to ISO strings", () => {
      const d = new Date("2023-01-01T10:00:00.000Z");
      expect(col.mapToDynamoValue(d)).toBe("2023-01-01T10:00:00.000Z");
    });

    it("should pass through valid ISO strings", () => {
      const iso = "2023-01-01T10:00:00.000Z";
      expect(col.mapToDynamoValue(iso)).toBe(iso);
    });

    it("should convert numeric timestamps to ISO strings", () => {
      const d = new Date("2023-01-01T10:00:00.000Z");
      const ts = d.getTime();
      expect(col.mapToDynamoValue(ts)).toBe("2023-01-01T10:00:00.000Z");
    });

    it("should throw error for invalid dates", () => {
      expect(() => col.mapToDynamoValue("invalid-date")).toThrow();
      expect(() => col.mapToDynamoValue(NaN)).toThrow();
    });
  });

  describe("deserialization (mapFromDynamoValue)", () => {
    it("should deserialize ISO strings to Date objects", () => {
      const iso = "2023-01-01T10:00:00.000Z";
      const result = col.mapFromDynamoValue(iso);
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).toISOString()).toBe(iso);
    });

    it("should handle null/undefined gracefully (pass through)", () => {
      expect(col.mapFromDynamoValue(null)).toBe(null);
      expect(col.mapFromDynamoValue(undefined)).toBe(undefined);
    });
  });

  describe("InsertBase integration", () => {
    it("should serialize date in buildItem()", () => {
      const mockClient = {} as unknown;
      const d = new Date("2023-10-27T10:00:00.000Z");

      const insert = new InsertBase(entity, mockClient as unknown as any, {
        pk: d,
      });

      const item = (insert as unknown as any).buildItem();
      expect(item.pk).toBe("2023-10-27T10:00:00.000Z");
    });

    it("should apply defaultNow()", () => {
      const t = dynamoTable("test", { pk: date("pk").partitionKey() });
      const e = dynamoEntity(t, "test", {
        pk: date("pk"),
        createdAt: date("createdAt").defaultNow(),
      });
      const insert = new InsertBase(e, {} as unknown as any, { pk: new Date() });
      const item = (insert as unknown as { buildItem: () => Record<string, unknown> }).buildItem();
      expect(item.createdAt).toBeDefined();
      expect(typeof item.createdAt).toBe("string");
      expect(new Date(item.createdAt as string).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("UpdateBuilder integration", () => {
    it("should serialize date in set()", () => {
      const mockClient = {} as unknown;
      const update = new UpdateBuilder(entity, mockClient as unknown as any);
      const d = new Date("2023-10-27T10:00:00.000Z");

      update.set({ pk: d });

      expect(
        (update as unknown as { _state: { set: Record<string, { value: unknown }> } })._state.set.pk
          ?.value,
      ).toBe("2023-10-27T10:00:00.000Z");
    });

    it("should apply onUpdateNow()", async () => {
      const t = dynamoTable("test", { pk: date("pk").partitionKey() });
      const e = dynamoEntity(t, "test", {
        pk: date("pk"),
        updatedAt: date("updatedAt").onUpdateNow(),
      });
      const mockClient = { send: vi.fn().mockResolvedValue({ Attributes: {} }) } as unknown;
      const update = new UpdateBuilder(e, mockClient as unknown as any);
      update.set({ pk: new Date() });

      await (update as unknown as any).execute();

      const state = (update as unknown as any)._state;
      expect(state.set.updatedAt).toBeDefined();
      expect(typeof state.set.updatedAt!.value).toBe("string");
    });
  });

  describe("Integration & Sorting", () => {
    it("should sort ISO strings chronologically", () => {
      const d1 = new Date("2023-01-01T10:00:00.000Z").toISOString();
      const d2 = new Date("2023-01-02T10:00:00.000Z").toISOString();
      const d3 = new Date("2024-01-01T10:00:00.000Z").toISOString();

      const dates = [d3, d1, d2];
      dates.sort();

      expect(dates).toEqual([d1, d2, d3]);
    });

    it("should handle reserved words as column names", () => {
      const t = dynamoTable("test", { pk: date("date").partitionKey() });
      const e = dynamoEntity(t, "test", {
        pk: date("date"),
      });

      const expression = eq(e.pk, new Date("2023-10-27T10:00:00.000Z"));

      const names: Record<string, string> = {};
      const values: Record<string, unknown> = {};
      const addName = (n: string) => {
        const k = `#n${Object.keys(names).length}`;
        names[k] = n;
        return k;
      };
      const addValue = (v: unknown) => {
        const k = `:v${Object.keys(values).length}`;
        values[k] = v;
        return k;
      };

      const result = buildExpression(expression, addName, addValue);

      expect(result).toBe("#n0 = :v0");
      expect(names["#n0"]).toBe("date");
    });
  });
});
