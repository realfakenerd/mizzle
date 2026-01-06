import { MizzleConfig } from "../../config";
import { DynamoDBClient, ListTablesCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { intro, outro, multiselect, confirm, isCancel, cancel, spinner } from "@clack/prompts";

interface DropOptions {
    config: MizzleConfig;
    client?: DynamoDBClient;
}

export async function dropCommand(options: DropOptions) {
    intro("Mizzle Drop Tables");

    const client = options.client || new DynamoDBClient({});
    
    // 1. Fetch tables
    const listCmd = new ListTablesCommand({});
    const listRes = await client.send(listCmd);
    const tableNames = listRes.TableNames || [];

    if (tableNames.length === 0) {
        console.log("No tables found in the remote environment.");
        outro("Done");
        return;
    }

    // 2. Select tables
    const selectedTables = await multiselect({
        message: "Select tables to DELETE (This action is irreversible!)",
        options: tableNames.map(name => ({ value: name, label: name }))
    });

    if (isCancel(selectedTables)) {
        cancel("Operation cancelled.");
        return;
    }

    const tablesToDelete = selectedTables as string[];
    if (tablesToDelete.length === 0) {
        console.log("No tables selected.");
        outro("Done");
        return;
    }

    // 3. Confirm
    const confirmed = await confirm({
        message: `Are you SURE you want to delete ${tablesToDelete.length} table(s)?`
    });

    if (isCancel(confirmed) || !confirmed) {
        console.log("Operation cancelled.");
        outro("Done");
        return;
    }

    // 4. Delete
    const s = spinner();
    s.start("Deleting tables...");

    for (const tableName of tablesToDelete) {
        s.message(`Deleting ${tableName}...`);
        try {
            await client.send(new DeleteTableCommand({ TableName: tableName }));
        } catch (error) {
            s.stop(`Failed to delete ${tableName}`);
            console.error(error);
            return;
        }
    }

    s.stop("All selected tables deleted.");
    outro("Done");
}
