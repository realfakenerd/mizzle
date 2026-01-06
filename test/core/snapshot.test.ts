import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { saveSnapshot, loadSnapshot, type MizzleSnapshot } from "../../packages/mizzle/src/core/snapshot";
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEMP_DIR = join(tmpdir(), "mizzle-snapshot-test-" + Date.now());
const MIGRATIONS_DIR = join(TEMP_DIR, "migrations");

describe("Snapshot Storage", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mkdirSync(MIGRATIONS_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  test("should save and load a snapshot", async () => {
    const snapshot: MizzleSnapshot = {
      version: "1",
      tables: {
        "users": {
          TableName: "users",
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        }
      }
    };

    const snapshotPath = join(MIGRATIONS_DIR, "snapshot.json");
    await saveSnapshot(MIGRATIONS_DIR, snapshot);

    expect(existsSync(snapshotPath)).toBe(true);
    
    const loaded = await loadSnapshot(MIGRATIONS_DIR);
    expect(loaded).toEqual(snapshot);
  });

  test("should create directory if it does not exist", async () => {
    const newDir = join(TEMP_DIR, "new-migrations");
    const snapshot: MizzleSnapshot = { version: "1", tables: {} };
    
    await saveSnapshot(newDir, snapshot);
    expect(existsSync(join(newDir, "snapshot.json"))).toBe(true);
  });

  test("should return null if no snapshot exists", async () => {
    const loaded = await loadSnapshot(join(TEMP_DIR, "empty"));
    expect(loaded).toBeNull();
  });
});
