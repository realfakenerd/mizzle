import { describe, it, expect } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Monorepo Setup", () => {
  it("should have a package.json with workspaces configured", () => {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    expect(packageJson.workspaces).toBeDefined();
    expect(packageJson.workspaces).toContain("packages/*");
  });

  it("should have a turbo.json configuration file", () => {
    const turboJsonPath = join(process.cwd(), "turbo.json");
    expect(existsSync(turboJsonPath)).toBe(true);
  });

  it("should have a packages directory", () => {
    const packagesPath = join(process.cwd(), "packages");
    expect(existsSync(packagesPath)).toBe(true);
  });
});
