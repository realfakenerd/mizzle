import { describe, it, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("Mizzle Core Package", () => {
  const mizzlePath = join(process.cwd(), "packages", "mizzle");

  it("should have a package.json", () => {
    expect(existsSync(join(mizzlePath, "package.json"))).toBe(true);
  });

  it("should have migrated core directories", () => {
    expect(existsSync(join(mizzlePath, "src", "builders"))).toBe(true);
    expect(existsSync(join(mizzlePath, "src", "columns"))).toBe(true);
    expect(existsSync(join(mizzlePath, "src", "expressions"))).toBe(true);
    expect(existsSync(join(mizzlePath, "src", "core"))).toBe(true);
  });
});
