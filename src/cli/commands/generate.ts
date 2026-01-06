import { MizzleConfig } from "../../config";
import { discoverSchema } from "../../utils/discovery";
import { loadSnapshot, saveSnapshot, generateSnapshot, getNextMigrationVersion, MizzleSnapshot, SchemaCurrent } from "../../core/snapshot";
import { compareSchema, SchemaChange } from "../../core/diff";
import { join } from "path";
import { writeFile } from "fs/promises";
import { text, isCancel, cancel, intro, outro } from "@clack/prompts";

interface GenerateOptions {
    config: MizzleConfig;
    discoverSchema?: typeof discoverSchema;
}

export async function generateCommand(options: GenerateOptions) {
    intro("Mizzle Generate");
    const { config } = options;
    const discover = options.discoverSchema || discoverSchema;

    try {
        // 1. Discover Schema
        const schema = await discover(config); // Returns { tables, entities }
        
        // 2. Load Snapshot
        const migrationsDir = config.out;
        const existingSnapshot = await loadSnapshot(migrationsDir) || { version: "0", tables: {} };

        // 3. Compare
        const currentSnapshot = generateSnapshot(schema);
        const changes = compareSchema(schema, existingSnapshot);

        if (changes.length === 0) {
            outro("No changes detected.");
            return;
        }

        console.log(`Detected ${changes.length} changes.`);

        // 4. Generate Migration Script
        const version = await getNextMigrationVersion(migrationsDir);
        
        const name = await text({
            message: "Enter migration name",
            placeholder: "init",
            initialValue: "migration",
            validate(value) {
                if (value.length === 0) return "Name is required";
            }
        });

        if (isCancel(name)) {
            cancel("Operation cancelled.");
            return;
        }

        const filename = `${version}_${name}.ts`;
        const filePath = join(migrationsDir, filename);

        const scriptContent = generateMigrationScript(changes);
        await writeFile(filePath, scriptContent);
        console.log(`Created migration: ${filename}`);

        // 5. Save new Snapshot
        await saveSnapshot(migrationsDir, currentSnapshot);
        outro("Updated snapshot.json");
    } catch (error) {
        console.error("Error generating migration:", error);
        process.exit(1);
    }
}

function generateMigrationScript(changes: SchemaChange[]): string {
    const upSteps: string[] = [];
    const downSteps: string[] = [];

    for (const change of changes) {
        if (change.type === "create") {
            upSteps.push(`// Create Table: ${change.table.TableName}`);
            upSteps.push(`await db.createTable("${change.table.TableName}", ${JSON.stringify(change.table, null, 2)});
`);
            
            downSteps.unshift(`// Drop Table: ${change.table.TableName}`);
            downSteps.unshift(`await db.deleteTable("${change.table.TableName}");
`);
        } else if (change.type === "delete") {
            upSteps.push(`// Drop Table: ${change.tableName}`);
            upSteps.push(`await db.deleteTable("${change.tableName}");
`);
            
            downSteps.unshift(`// Create Table: ${change.tableName}`);
            downSteps.unshift(`// TODO: Restore table definition for rollback
`);
        } else if (change.type === "update") {
            upSteps.push(`// Update Table: ${change.tableName}`);
            downSteps.unshift(`// Revert Update Table: ${change.tableName}`);
        }
    }

    return `import { Mizzle } from "mizzle";

export async function up(db: Mizzle) {
    ${upSteps.join("    ")}
}

export async function down(db: Mizzle) {
    ${downSteps.join("    ")}
}
`;
}
