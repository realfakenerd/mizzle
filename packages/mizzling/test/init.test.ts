import { expect, test } from "vitest";
import { spawnSync } from "child_process";
import { join } from "path";

test("cli should show help message", () => {
  const projectRoot = process.cwd().includes("packages/mizzling") 
    ? join(process.cwd(), "../..") 
    : process.cwd();
  const mizzlingCliPath = join(projectRoot, "packages/mizzling/src/cli.ts");

  const result = spawnSync("bun", [mizzlingCliPath, "--help"], {
    encoding: "utf-8",
  });

  // Since src/cli.ts doesn't exist, it might fail with a non-zero exit code or error
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("Usage: mizzle [options] [command]");
  expect(result.stdout).toContain("generate");
  expect(result.stdout).toContain("push");
  expect(result.stdout).toContain("list");
  expect(result.stdout).toContain("drop");
});
