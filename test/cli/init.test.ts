import { expect, test } from "bun:test";
import { spawnSync } from "child_process";

test("cli should show help message", () => {
  const result = spawnSync("bun", ["packages/mizzling/src/index.ts", "--help"], {
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
