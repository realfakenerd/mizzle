import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { discoverSchema } from "../../src/utils/discovery";
import { PhysicalTable } from "../../src/core/table";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-discovery-test-" + Date.now());

describe("Schema Discovery", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  test("should discover tables in a file", async () => {
    const schemaContent = `
      import { dynamoTable } from "${join(originalCwd, "src/core/table")}"; 
      
      export const UsersTable = dynamoTable("users", {
        pk: { build: () => ({ _: { name: "id", type: "string" } }) }, // Mocking column builder
      });
    `;
    writeFileSync(join(TEMP_DIR, "schema.ts"), schemaContent);

    const tables = await discoverSchema({ 
      schema: join(TEMP_DIR, "schema.ts"),
      out: "./migrations" 
    });
    
    expect(tables).toHaveLength(1);
    expect(tables[0]).toBeInstanceOf(PhysicalTable);
    // @ts-ignore
    expect(tables[0][Symbol.for("mizzle:TableName")]).toBe("users");
  });

  test("should ignore non-table exports", async () => {
    const schemaContent = `
      export const SomethingElse = { foo: "bar" };
    `;
    writeFileSync(join(TEMP_DIR, "other.ts"), schemaContent);

    const tables = await discoverSchema({ 
      schema: join(TEMP_DIR, "other.ts"),
      out: "./migrations" 
    });
    
    expect(tables).toHaveLength(0);
  });

  test("should discover tables in a directory", async () => {
    const schemaContent = `
      import { dynamoTable } from "${join(originalCwd, "src/core/table")}"; 
      export const UsersTable = dynamoTable("users_dir", { pk: { build: () => ({ _: { name: "id", type: "string" } }) } });
    `;
    mkdirSync(join(TEMP_DIR, "tables"), { recursive: true });
    writeFileSync(join(TEMP_DIR, "tables/users.ts"), schemaContent);

    const tables = await discoverSchema({ 
      schema: join(TEMP_DIR, "tables"), // Directory path
      out: "./migrations" 
    });
    
    expect(tables).toHaveLength(1);
    // @ts-ignore
    expect(tables[0][Symbol.for("mizzle:TableName")]).toBe("users_dir");
  });

  test("should handle import failures gracefully", async () => {
    const schemaContent = `
      export const UsersTable = dynamoTable("users", ...); // Syntax error
    `;
    writeFileSync(join(TEMP_DIR, "broken.ts"), schemaContent);
    
    const tables = await discoverSchema({ 
        schema: join(TEMP_DIR, "broken.ts"),
        out: "./migrations" 
    });
    expect(tables).toHaveLength(0);
  });
});
