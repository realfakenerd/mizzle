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

  it("should have a packages/tsconfig directory with package.json and base.json", () => {
    const tsconfigPath = join(process.cwd(), "packages", "tsconfig");
    expect(existsSync(tsconfigPath)).toBe(true);
    expect(existsSync(join(tsconfigPath, "package.json"))).toBe(true);
    expect(existsSync(join(tsconfigPath, "base.json"))).toBe(true);
  });

  it("should have a packages/eslint-config directory with package.json and index.cjs", () => {
    const eslintConfigPath = join(process.cwd(), "packages", "eslint-config");
    expect(existsSync(eslintConfigPath)).toBe(true);
    expect(existsSync(join(eslintConfigPath, "package.json"))).toBe(true);
    expect(existsSync(join(eslintConfigPath, "index.cjs"))).toBe(true);
  });
});
