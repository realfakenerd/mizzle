import { MizzleSnapshot, TableSnapshot, SchemaCurrent, generateSnapshot } from "./snapshot";

export type SchemaChange = 
  | { type: "create"; table: TableSnapshot }
  | { type: "delete"; tableName: string }
  | { type: "update"; tableName: string; changes: any[] };

export function compareSchema(current: SchemaCurrent, snapshot: MizzleSnapshot): SchemaChange[] {
    const changes: SchemaChange[] = [];
    const currentSnapshot = generateSnapshot(current);
    
    const currentTables = currentSnapshot.tables;
    const snapshotTables = snapshot.tables || {};
    
    const allTableNames = new Set([...Object.keys(currentTables), ...Object.keys(snapshotTables)]);

    for (const tableName of allTableNames) {
        const currentTable = currentTables[tableName];
        const snapshotTable = snapshotTables[tableName];

        if (currentTable && !snapshotTable) {
            changes.push({ type: "create", table: currentTable });
        } else if (!currentTable && snapshotTable) {
            changes.push({ type: "delete", tableName });
        } else if (currentTable && snapshotTable) {
            if (!areSnapshotsEqual(currentTable, snapshotTable)) {
                changes.push({ type: "update", tableName, changes: ["Changed"] });
            }
        }
    }

    return changes;
}

function areSnapshotsEqual(a: TableSnapshot, b: TableSnapshot): boolean {
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
