import { join } from "path";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

export interface TableSnapshot {
  TableName: string;
  AttributeDefinitions: { AttributeName: string; AttributeType: string }[];
  KeySchema: { AttributeName: string; KeyType: "HASH" | "RANGE" }[];
  GlobalSecondaryIndexes?: any[];
  LocalSecondaryIndexes?: any[];
}

export interface MizzleSnapshot {
  version: string;
  tables: Record<string, TableSnapshot>;
}

const SNAPSHOT_FILENAME = "snapshot.json";

export async function saveSnapshot(dir: string, snapshot: MizzleSnapshot): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  const filePath = join(dir, SNAPSHOT_FILENAME);
  await writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

export async function loadSnapshot(dir: string): Promise<MizzleSnapshot | null> {
  const filePath = join(dir, SNAPSHOT_FILENAME);
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as MizzleSnapshot;
}