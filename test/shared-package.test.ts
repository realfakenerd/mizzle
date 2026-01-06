import { describe, it, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("Shared Package", () => {
  const sharedPath = join(process.cwd(), "packages", "shared");

  it("should have a package.json", () => {
    expect(existsSync(join(sharedPath, "package.json"))).toBe(true);
  });

  it("should have migrated utils and constants", () => {
    expect(existsSync(join(sharedPath, "src", "utils.ts"))).toBe(true);
    expect(existsSync(join(sharedPath, "src", "constants.ts"))).toBe(true);
  });

  it("should have an index.ts exporting everything", () => {
    expect(existsSync(join(sharedPath, "src", "index.ts"))).toBe(true);
  });
});
