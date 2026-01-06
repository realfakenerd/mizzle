import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { discoverSchema } from "../../src/utils/discovery";
import { PhysicalTable, Entity } from "../../packages/mizzle/src/core/table";
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

    const result = await discoverSchema({ 
      schema: join(TEMP_DIR, "schema.ts"),
      out: "./migrations" 
    });
    
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0]).toBeInstanceOf(PhysicalTable);
    // @ts-ignore
    expect(result.tables[0][Symbol.for("mizzle:TableName")]).toBe("users");
  });

  test("should discover entities in a file", async () => {
     const schemaContent = `
      import { dynamoTable, dynamoEntity, Entity } from "${join(originalCwd, "src/core/table")}"; 
      
      const UsersTable = dynamoTable("users", {
        pk: { build: () => ({ _: { name: "id", type: "string" } }) },
      });

      export const UserEntity = dynamoEntity(UsersTable, "User", {
         id: { build: () => ({ _: { name: "id", type: "string" } }), setName: () => {} } as any
      });
    `;
    writeFileSync(join(TEMP_DIR, "entity.ts"), schemaContent);

    const result = await discoverSchema({ 
      schema: join(TEMP_DIR, "entity.ts"),
      out: "./migrations" 
    });
    
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toBeInstanceOf(Entity);
    // @ts-ignore
    expect(result.entities[0][Symbol.for("mizzle:EntityName")]).toBe("User");
  });

  test("should ignore non-table exports", async () => {
    const schemaContent = `
      export const SomethingElse = { foo: "bar" };
    `;
    writeFileSync(join(TEMP_DIR, "other.ts"), schemaContent);

    const result = await discoverSchema({ 
      schema: join(TEMP_DIR, "other.ts"),
      out: "./migrations" 
    });
    
    expect(result.tables).toHaveLength(0);
    expect(result.entities).toHaveLength(0);
  });

  test("should discover tables in a directory", async () => {
    const schemaContent = `
      import { dynamoTable } from "${join(originalCwd, "src/core/table")}"; 
      export const UsersTable = dynamoTable("users_dir", { pk: { build: () => ({ _: { name: "id", type: "string" } }) } });
    `;
    mkdirSync(join(TEMP_DIR, "tables"), { recursive: true });
    writeFileSync(join(TEMP_DIR, "tables/users.ts"), schemaContent);

    const result = await discoverSchema({ 
      schema: join(TEMP_DIR, "tables"), // Directory path
      out: "./migrations" 
    });
    
    expect(result.tables).toHaveLength(1);
    // @ts-ignore
    expect(result.tables[0][Symbol.for("mizzle:TableName")]).toBe("users_dir");
  });

  test("should handle import failures gracefully", async () => {
    const schemaContent = `
      export const UsersTable = dynamoTable("users", ...); // Syntax error
    `;
    writeFileSync(join(TEMP_DIR, "broken.ts"), schemaContent);
    
    const result = await discoverSchema({ 
        schema: join(TEMP_DIR, "broken.ts"),
        out: "./migrations" 
    });
    expect(result.tables).toHaveLength(0);
  });
});
