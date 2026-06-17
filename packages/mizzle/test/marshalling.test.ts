import { expect, test, describe } from "vitest";
import { marshallDates } from "../src/core/marshalling";

describe("marshallDates", () => {
  test("should convert Date to ISO string", () => {
    const date = new Date("2025-01-10T12:00:00Z");
    expect(marshallDates(date)).toBe("2025-01-10T12:00:00.000Z");
  });

  test("should recursively convert Dates in objects", () => {
    const input = {
      id: 1,
      createdAt: new Date("2025-01-10T12:00:00Z"),
      meta: {
        updatedAt: new Date("2025-01-11T12:00:00Z"),
      },
    };

    const output = marshallDates(input) as any;
    expect(output.createdAt).toBe("2025-01-10T12:00:00.000Z");
    expect(output.meta.updatedAt).toBe("2025-01-11T12:00:00.000Z");
    expect(output.id).toBe(1);
  });

  test("should recursively convert Dates in arrays", () => {
    const input = [
      new Date("2025-01-10T12:00:00Z"),
      { d: new Date("2025-01-11T12:00:00Z") }
    ];

    const output = marshallDates(input) as any[];
    expect(output[0]).toBe("2025-01-10T12:00:00.000Z");
    expect(output[1].d).toBe("2025-01-11T12:00:00.000Z");
  });

  test("should handle Sets", () => {
    const date = new Date("2025-01-10T12:00:00Z");
    const input = new Set([date]);
    const output = marshallDates(input) as Set<unknown>;
    expect(output).toBeInstanceOf(Set);
    expect(Array.from(output)).toContain("2025-01-10T12:00:00.000Z");
  });
});
