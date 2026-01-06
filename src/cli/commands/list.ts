import { MizzleConfig } from "../../config";
import { getRemoteSnapshot } from "../../core/introspection";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { intro, outro } from "@clack/prompts";

interface ListOptions {
    config: MizzleConfig;
    client?: DynamoDBClient;
}

export async function listCommand(options: ListOptions) {
    intro("Mizzle List Tables");
    
    const client = options.client || new DynamoDBClient({});
    const snapshot = await getRemoteSnapshot(client);
    
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
}
