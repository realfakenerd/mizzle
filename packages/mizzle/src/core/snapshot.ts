import { join } from "path";
import { writeFile, readFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import { PhysicalTable, Entity } from "./table";
import { TABLE_SYMBOLS, ENTITY_SYMBOLS } from "@mizzle/shared";

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

export interface SchemaCurrent {
    tables: PhysicalTable[];
    entities: Entity[];
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

export function generateSnapshot(schema: SchemaCurrent): MizzleSnapshot {
    const tables: Record<string, TableSnapshot> = {};
    
    for (const table of schema.tables) {
        const associatedEntities = schema.entities.filter(e => e[ENTITY_SYMBOLS.PHYSICAL_TABLE] === table);
        const tableSnapshot = physicalTableToSnapshot(table, associatedEntities);
        tables[tableSnapshot.TableName] = tableSnapshot;
    }
    
    return {
        version: "1",
        tables
    };
}

export async function getNextMigrationVersion(migrationsDir: string): Promise<string> {
    if (!existsSync(migrationsDir)) return "0000";
    
    const files = await readdir(migrationsDir);
    let maxVersion = -1;
    
    for (const file of files) {
        if (!file.endsWith(".ts")) continue;
        const match = file.match(/^(\d{4})_/);
        if (match) {
            const version = parseInt(match[1]!, 10);
            if (version > maxVersion) maxVersion = version;
        }
    }
    
    if (maxVersion === -1) return "0000";
    return (maxVersion + 1).toString().padStart(4, "0");
}

function physicalTableToSnapshot(table: PhysicalTable, entities: Entity[]): TableSnapshot {
    const tableName = table[TABLE_SYMBOLS.TABLE_NAME];
    const attributeDefinitionsMap = new Map<string, string>(); // Name -> Type

    // PK
    const pk = table[TABLE_SYMBOLS.PARTITION_KEY] as any;
    attributeDefinitionsMap.set(pk.name, pk.getDynamoType());

    // SK
    const sk = table[TABLE_SYMBOLS.SORT_KEY] as any;
    if (sk) {
        attributeDefinitionsMap.set(sk.name, sk.getDynamoType());
    }

    const keySchema: { AttributeName: string; KeyType: "HASH" | "RANGE" }[] = [
        { AttributeName: pk.name, KeyType: "HASH" }
    ];
    if (sk) {
        keySchema.push({ AttributeName: sk.name, KeyType: "RANGE" as const });
    }

    const gsis: any[] = [];
    const lsis: any[] = [];

    const indexes = table[TABLE_SYMBOLS.INDEXES] || {};
    for (const [indexName, indexBuilder] of Object.entries(indexes)) {
        const type = (indexBuilder as any).type;
        const config = (indexBuilder as any).config;

        if (type === 'gsi') {
            if (config.pk) {
                const pkType = resolveColumnType(config.pk, table, entities);
                attributeDefinitionsMap.set(config.pk, pkType);
            }
            if (config.sk) {
                const skType = resolveColumnType(config.sk, table, entities);
                attributeDefinitionsMap.set(config.sk, skType);
            }

            const gsiDef: any = {
                IndexName: indexName,
                KeySchema: [
                    { AttributeName: config.pk, KeyType: "HASH" }
                ],
                Projection: { ProjectionType: "ALL" }
            };
            if (config.sk) {
                gsiDef.KeySchema.push({ AttributeName: config.sk, KeyType: "RANGE" });
            }
            gsis.push(gsiDef);

        } else if (type === 'lsi') {
             if (config.sk) {
                const skType = resolveColumnType(config.sk, table, entities);
                attributeDefinitionsMap.set(config.sk, skType);
            }

             const lsiDef: any = {
                IndexName: indexName,
                KeySchema: [
                    { AttributeName: pk.name, KeyType: "HASH" },
                    { AttributeName: config.sk, KeyType: "RANGE" }
                ],
                Projection: { ProjectionType: "ALL" }
             };
             lsis.push(lsiDef);
        }
    }

    const attributeDefinitions = Array.from(attributeDefinitionsMap.entries()).map(([name, type]) => ({
        AttributeName: name,
        AttributeType: type
    })).sort((a, b) => a.AttributeName.localeCompare(b.AttributeName));

    gsis.sort((a, b) => a.IndexName.localeCompare(b.IndexName));
    lsis.sort((a, b) => a.IndexName.localeCompare(b.IndexName));

    const result: TableSnapshot = {
        TableName: tableName as string,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
    };

    if (gsis.length > 0) result.GlobalSecondaryIndexes = gsis;
    if (lsis.length > 0) result.LocalSecondaryIndexes = lsis;

    return result;
}

function resolveColumnType(columnName: string, table: PhysicalTable, entities: Entity[]): string {
    const pk = table[TABLE_SYMBOLS.PARTITION_KEY] as any;
    if (pk.name === columnName) return pk.getDynamoType();
    
    const sk = table[TABLE_SYMBOLS.SORT_KEY] as any;
    if (sk && sk.name === columnName) return sk.getDynamoType();

    for (const entity of entities) {
        const columns = entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any> | undefined;
        if (columns) {
            const col = columns[columnName];
            if (col) {
                return col.getDynamoType();
            }
        }
    }

    throw new Error(`Could not resolve type for column '${columnName}' in table '${table[TABLE_SYMBOLS.TABLE_NAME]}'. Ensure it is defined in an Entity.`);
}
