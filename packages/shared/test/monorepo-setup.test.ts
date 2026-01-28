import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("Monorepo Setup", () => {
  const projectRoot = process.cwd().includes("packages/shared") 
    ? join(process.cwd(), "../..") 
    : process.cwd();

  it("should have a package.json with workspaces configured", () => {
    const packageJsonPath = join(projectRoot, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    expect(packageJson.workspaces).toBeDefined();
    expect(packageJson.workspaces).toContain("packages/*");
  });

  it("should have a turbo.json configuration file with tasks", () => {
    const turboJsonPath = join(projectRoot, "turbo.json");
    expect(existsSync(turboJsonPath)).toBe(true);
    const turboJson = JSON.parse(readFileSync(turboJsonPath, "utf-8"));
    expect(turboJson.tasks).toBeDefined();
  });

  it("should have a packages directory", () => {
    const packagesPath = join(projectRoot, "packages");
    expect(existsSync(packagesPath)).toBe(true);
  });

  it("should have a packages/tsconfig directory with package.json and base.json", () => {
    const tsconfigPath = join(projectRoot, "packages", "tsconfig");
    expect(existsSync(tsconfigPath)).toBe(true);
    expect(existsSync(join(tsconfigPath, "package.json"))).toBe(true);
    expect(existsSync(join(tsconfigPath, "base.json"))).toBe(true);
  });

  it("should have root configs extending shared configs", () => {
    const tsconfig = JSON.parse(readFileSync(join(projectRoot, "tsconfig.json"), "utf-8"));
    expect(tsconfig.extends).toBeDefined();
    // It currently extends ./packages/tsconfig/base.json
    expect(tsconfig.extends).toContain("packages/tsconfig/base.json");
  });
});