import { type MizzleConfig, getClient } from "../config";
import { discoverSchema } from "../discovery";
import { compareSchema } from "mizzle/diff";
import { getRemoteSnapshot } from "mizzle/introspection";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { confirm, isCancel, cancel, intro, outro, spinner } from "@clack/prompts";

interface PushOptions {
    config: MizzleConfig;
    force?: boolean;
    discoverSchema?: typeof discoverSchema;
    client?: DynamoDBClient;
}

export async function pushCommand(options: PushOptions) {
    intro("Mizzle Push");
    const { config, force } = options;
    const discover = options.discoverSchema || discoverSchema;
    
    const client = options.client || getClient(config); 

    try {
        const schema = await discover(config);
        const remoteSnapshot = await getRemoteSnapshot(client);

        const changes = compareSchema(schema, remoteSnapshot);

        if (changes.length === 0) {
            outro("Remote is up to date.");
            return;
        }

        console.log(`Pushing ${changes.length} changes to remote...`);

        let shouldContinue = force;
        if (!shouldContinue) {
            shouldContinue = await confirm({
                message: "Do you want to apply these changes?"
            }) as boolean;
        }

        if (isCancel(shouldContinue) || !shouldContinue) {
            cancel("Operation cancelled.");
            return;
        }

        const s = spinner();
        s.start("Pushing changes...");

        for (const change of changes) {
            if (change.type === "create") {
                s.message(`Creating table: ${change.table.TableName}`);
                await client.send(
                    new CreateTableCommand({
                        TableName: change.table.TableName,
                        AttributeDefinitions: change.table.AttributeDefinitions,
                        KeySchema: change.table.KeySchema,
                        GlobalSecondaryIndexes: change.table.GlobalSecondaryIndexes,
                        LocalSecondaryIndexes: change.table.LocalSecondaryIndexes,
                        BillingMode: "PAY_PER_REQUEST",
                    }),
                );
            } else if (change.type === "delete") {
                console.log(`Untracked table found: ${change.tableName} (Skipping deletion)`);
            } else if (change.type === "update") {
                s.message(`Updating table: ${change.tableName} (Not fully implemented)`);
            }
        }
        s.stop("Push complete.");
        outro("Done");
    } catch (error) {
        console.error("Error pushing changes:", error);
        process.exit(1);
    }
}
