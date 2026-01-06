import { type MizzleConfig, getClient } from "../../config";
import { getRemoteSnapshot } from "mizzle/introspection";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { intro, outro, spinner } from "@clack/prompts";

interface ListOptions {
    config: MizzleConfig;
    client?: DynamoDBClient;
}

export async function listCommand(options: ListOptions) {
    intro("Mizzle List Tables");
    
    const client = options.client || getClient(options.config);
    const s = spinner();
    s.start("Fetching remote tables...");

    try {
        const snapshot = await getRemoteSnapshot(client);
        s.stop("Fetched remote tables.");
        
        const tables = Object.values(snapshot.tables);

        if (tables.length === 0) {
            console.log("No tables found in the remote environment.");
            outro("Done");
            return;
        }

        console.log(`Found ${tables.length} tables:`);
        for (const table of tables) {
            console.log(`- ${table.TableName}`);
            const pk = table.KeySchema.find(k => k.KeyType === "HASH")?.AttributeName;
            const sk = table.KeySchema.find(k => k.KeyType === "RANGE")?.AttributeName;
            console.log(`  PK: ${pk}, SK: ${sk || "(none)"}`);
            
            if (table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0) {
                 console.log(`  GSIs: ${table.GlobalSecondaryIndexes.map(g => g.IndexName).join(", ")}`);
            }
        }

        outro("Done");
    } catch (error) {
        s.stop("Failed to fetch tables.");
        console.error("Error listing tables:", error);
        process.exit(1);
    }
}
