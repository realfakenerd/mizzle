import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { TABLE_NAME, REGION, ENDPOINT } from "./env";

const client = new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
    },
});

export function getTableName() {
    return process.env.MIZZLE_BENCH_TABLE || TABLE_NAME;
}

export async function createTable() {
    const tableName = getTableName();
    console.log(`Creating table ${tableName}...`);
    try {
        await client.send(
            new CreateTableCommand({
                TableName: tableName,
                KeySchema: [
                    { AttributeName: "pk", KeyType: "HASH" },
                    { AttributeName: "sk", KeyType: "RANGE" },
                ],
                AttributeDefinitions: [
                    { AttributeName: "pk", AttributeType: "S" },
                    { AttributeName: "sk", AttributeType: "S" },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1000,
                    WriteCapacityUnits: 1000,
                },
            })
        );
        console.log("Table created.");
    } catch (e: any) {
        if (e.name === "ResourceInUseException") {
            console.log("Table already exists.");
        } else {
            throw e;
        }
    }
}

export async function deleteTable() {
    const tableName = getTableName();
    console.log(`Deleting table ${tableName}...`);
    try {
        await client.send(
            new DeleteTableCommand({
                TableName: tableName,
            })
        );
        console.log("Table deleted.");
    } catch (e: any) {
        if (e.name === "ResourceNotFoundException") {
            console.log("Table does not exist.");
        } else {
            throw e;
        }
    }
}

export async function waitForTable() {
    const tableName = getTableName();
    console.log("Waiting for table to be active...");
    let active = false;
    while (!active) {
        try {
            const { Table } = await client.send(
                new DescribeTableCommand({ TableName: tableName })
            );
            if (Table?.TableStatus === "ACTIVE") {
                active = true;
            } else {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } catch (e: any) {
            if (e.name === "ResourceNotFoundException") {
                await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
                throw e;
            }
        }
    }
    console.log("Table is active.");
}

if (import.meta.main) {
    const command = Bun.argv[2];
    if (command === "create") {
        await createTable();
        await waitForTable();
    } else if (command === "delete") {
        await deleteTable();
    } else {
        console.log("Usage: bun setup.ts [create|delete]");
    }
}
