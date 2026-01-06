import { PhysicalTable, Entity } from "./table";
import { MizzleSnapshot, TableSnapshot } from "./snapshot";
import { TABLE_SYMBOLS, ENTITY_SYMBOLS } from "../constants";

export type SchemaChange = 
  | { type: "create"; table: TableSnapshot }
  | { type: "delete"; tableName: string }
  | { type: "update"; tableName: string; changes: any[] };

export interface SchemaCurrent {
    tables: PhysicalTable[];
    entities: Entity[];
}

export function compareSchema(current: SchemaCurrent, snapshot: MizzleSnapshot): SchemaChange[] {
    const changes: SchemaChange[] = [];
    const currentTableMap = new Map<string, TableSnapshot>();

    // 1. Convert PhysicalTables to TableSnapshots
    for (const table of current.tables) {
        // Find associated entities
        const associatedEntities = current.entities.filter(e => e[ENTITY_SYMBOLS.PHYSICAL_TABLE] === table);
        const tableSnapshot = physicalTableToSnapshot(table, associatedEntities);
        currentTableMap.set(tableSnapshot.TableName, tableSnapshot);
    }

    // 2. Compare with Snapshot
    const snapshotTables = snapshot.tables || {};
    const allTableNames = new Set([...currentTableMap.keys(), ...Object.keys(snapshotTables)]);

    for (const tableName of allTableNames) {
        const currentTable = currentTableMap.get(tableName);
        const snapshotTable = snapshotTables[tableName];

        if (currentTable && !snapshotTable) {
            changes.push({ type: "create", table: currentTable });
        } else if (!currentTable && snapshotTable) {
            changes.push({ type: "delete", tableName });
        } else if (currentTable && snapshotTable) {
            // Compare
            if (!areSnapshotsEqual(currentTable, snapshotTable)) {
                changes.push({ type: "update", tableName, changes: ["Changed"] }); // Todo: detailed diff
            }
        }
    }

    return changes;
}

function physicalTableToSnapshot(table: PhysicalTable, entities: Entity[]): TableSnapshot {
    const tableName = table[TABLE_SYMBOLS.TABLE_NAME];
    const attributeDefinitionsMap = new Map<string, string>(); // Name -> Type

    // PK
    const pk = table[TABLE_SYMBOLS.PARTITION_KEY];
    attributeDefinitionsMap.set(pk.name, pk.getDynamoType());

    // SK
    const sk = table[TABLE_SYMBOLS.SORT_KEY];
    if (sk) {
        attributeDefinitionsMap.set(sk.name, sk.getDynamoType());
    }

    const keySchema = [
        { AttributeName: pk.name, KeyType: "HASH" as const }
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
            // Resolve PK type
            if (config.pk) {
                const pkType = resolveColumnType(config.pk, table, entities);
                attributeDefinitionsMap.set(config.pk, pkType);
            }
            // Resolve SK type
            if (config.sk) {
                const skType = resolveColumnType(config.sk, table, entities);
                attributeDefinitionsMap.set(config.sk, skType);
            }

            const gsiDef: any = {
                IndexName: indexName,
                KeySchema: [
                    { AttributeName: config.pk, KeyType: "HASH" }
                ],
                Projection: { ProjectionType: "ALL" } // Defaulting to ALL
            };
            if (config.sk) {
                gsiDef.KeySchema.push({ AttributeName: config.sk, KeyType: "RANGE" });
            }
            gsis.push(gsiDef);

        } else if (type === 'lsi') {
             // Resolve SK type (PK is same as table)
             if (config.sk) {
                const skType = resolveColumnType(config.sk, table, entities);
                attributeDefinitionsMap.set(config.sk, skType);
            }

             const lsiDef: any = {
                IndexName: indexName,
                KeySchema: [
                    { AttributeName: pk.name, KeyType: "HASH" }, // LSI shares table PK
                    { AttributeName: config.sk, KeyType: "RANGE" }
                ],
                Projection: { ProjectionType: "ALL" }
             };
             lsis.push(lsiDef);
        }
    }

    // Convert AttributeDefinitions map to array and sort
    const attributeDefinitions = Array.from(attributeDefinitionsMap.entries()).map(([name, type]) => ({
        AttributeName: name,
        AttributeType: type
    })).sort((a, b) => a.AttributeName.localeCompare(b.AttributeName));

    // Sort GSIs/LSIs
    gsis.sort((a, b) => a.IndexName.localeCompare(b.IndexName));
    lsis.sort((a, b) => a.IndexName.localeCompare(b.IndexName));

    const result: TableSnapshot = {
        TableName: tableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
    };

    if (gsis.length > 0) result.GlobalSecondaryIndexes = gsis;
    if (lsis.length > 0) result.LocalSecondaryIndexes = lsis;

    return result;
}

function resolveColumnType(columnName: string, table: PhysicalTable, entities: Entity[]): string {
    // 1. Check if it matches table PK/SK (already resolved, but good for consistency)
    const pk = table[TABLE_SYMBOLS.PARTITION_KEY];
    if (pk.name === columnName) return pk.getDynamoType();
    
    const sk = table[TABLE_SYMBOLS.SORT_KEY];
    if (sk && sk.name === columnName) return sk.getDynamoType();

    // 2. Check entities
    for (const entity of entities) {
        const columns = entity[ENTITY_SYMBOLS.COLUMNS];
        const col = columns[columnName];
        if (col) {
            return col.getDynamoType();
        }
    }

    throw new Error(`Could not resolve type for column '${columnName}' in table '${table[TABLE_SYMBOLS.TABLE_NAME]}'. Ensure it is defined in an Entity.`);
}

function areSnapshotsEqual(a: TableSnapshot, b: TableSnapshot): boolean {
    // Basic comparison using JSON stringify after verifying keys are sorted/deterministic.
    // Since we sort AttributeDefinitions and Indexes in physicalTableToSnapshot, 
    // we assume 'snapshot' from disk is also sorted or we should sort it too.
    // For now, let's assume strict equality on structure.
    
    // Helper to sort snapshot
    const sortSnapshot = (s: TableSnapshot) => {
        const copy = { ...s };
        copy.AttributeDefinitions = [...(copy.AttributeDefinitions || [])].sort((x, y) => x.AttributeName.localeCompare(y.AttributeName));
        if (copy.GlobalSecondaryIndexes) {
            copy.GlobalSecondaryIndexes = [...copy.GlobalSecondaryIndexes].sort((x, y) => x.IndexName.localeCompare(y.IndexName));
        }
        if (copy.LocalSecondaryIndexes) {
            copy.LocalSecondaryIndexes = [...copy.LocalSecondaryIndexes].sort((x, y) => x.IndexName.localeCompare(y.IndexName));
        }
        return copy;
    }

    return JSON.stringify(sortSnapshot(a)) === JSON.stringify(sortSnapshot(b));
}