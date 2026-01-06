import { MizzleConfig } from "../../config";
import { discoverSchema } from "../../utils/discovery";
import { compareSchema } from "../../core/diff";
import { getRemoteSnapshot } from "../../core/introspection";
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

interface PushOptions {
    config: MizzleConfig;
    discoverSchema?: typeof discoverSchema;
    client?: DynamoDBClient;
}

export async function pushCommand(options: PushOptions) {
    const { config } = options;
    const discover = options.discoverSchema || discoverSchema;
    
    const client = options.client || new DynamoDBClient({}); 

    const schema = await discover(config);
    const remoteSnapshot = await getRemoteSnapshot(client);

    const changes = compareSchema(schema, remoteSnapshot);

    if (changes.length === 0) {
        console.log("Remote is up to date.");
        return;
    }

    console.log(`Pushing ${changes.length} changes to remote...`);

    for (const change of changes) {
        if (change.type === "create") {
            console.log(`Creating table: ${change.table.TableName}`);
            await client.send(new CreateTableCommand({
                TableName: change.table.TableName,
                AttributeDefinitions: change.table.AttributeDefinitions as any,
                KeySchema: change.table.KeySchema as any,
                GlobalSecondaryIndexes: change.table.GlobalSecondaryIndexes as any,
                LocalSecondaryIndexes: change.table.LocalSecondaryIndexes as any,
                BillingMode: "PAY_PER_REQUEST"
            }));
        } else if (change.type === "delete") {
            console.log(`Deleting table: ${change.tableName}`);
            await client.send(new DeleteTableCommand({ TableName: change.tableName }));
        } else if (change.type === "update") {
             console.log(`Updating table: ${change.tableName} (Not fully implemented)`);
        }
    }
    console.log("Push complete.");
}
