import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { mizzle } from "./packages/mizzle/src/db";
import { dynamoTable, dynamoEntity } from "./packages/mizzle/src/core/table";
import { string, number } from "./packages/mizzle/src/columns/index";
import { eq, lt } from "./packages/mizzle/src/expressions/operators";
import { prefixKey } from "./packages/mizzle/src/index";

const client = new DynamoDBClient({
    endpoint: "http://localhost:8000",
    region: "us-east-1",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

const table = dynamoTable("VerificationTable", {
    pk: string("pk"),
    sk: string("sk"),
});

const Item = dynamoEntity(table, "Item", {
    id: string(),
    category: string(),
    value: number(),
}, (cols) => ({
    pk: prefixKey("ID#", cols.id),
    sk: prefixKey("CAT#", cols.category),
}));

async function verify() {
    const db = mizzle(client);
    
    console.log("Creating table...");
    try {
        await client.send(new CreateTableCommand({
            TableName: "VerificationTable",
            KeySchema: [
                { AttributeName: "pk", KeyType: "HASH" },
                { AttributeName: "sk", KeyType: "RANGE" },
            ],
            AttributeDefinitions: [
                { AttributeName: "pk", AttributeType: "S" },
                { AttributeName: "sk", AttributeType: "S" },
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        }));
    } catch (e) {}

    console.log("Setting up data...");
    await db.insert(Item).values({ id: "1", category: "A", value: 10 }).execute();
    await db.insert(Item).values({ id: "2", category: "A", value: 20 }).execute();
    await db.insert(Item).values({ id: "3", category: "B", value: 30 }).execute();

    console.log("1. Verifying Get (PK + SK)...");
    const getRes = await db.select().from(Item).where(eq(Item.id, "1")).execute();
    if (getRes.length === 1 && getRes[0].value === 10) {
        console.log("✅ Get successful");
    } else {
        console.error("❌ Get failed", getRes);
    }

    console.log("2. Verifying Query (PK only)...");
    // This might be a scan if SK is not provided, unless we support partial PK? 
    // In Mizzle, if SK is required by entity, we need both for Get. 
    // If we only provide PK, it should be a Query.
    const queryRes = await db.select().from(Item).where(eq(Item.id, "2")).execute();
    if (queryRes.length === 1 && queryRes[0].value === 20) {
        console.log("✅ Query successful");
    } else {
        console.error("❌ Query failed", queryRes);
    }

    console.log("3. Verifying Scan (Filter)...");
    const scanRes = await db.select().from(Item).where(lt(Item.value, 25)).execute();
    if (scanRes.length === 2) {
        console.log("✅ Scan successful");
    } else {
        console.error("❌ Scan failed", scanRes);
    }

    console.log("Cleaning up...");
    try {
        await client.send(new DeleteTableCommand({ TableName: "VerificationTable" }));
    } catch (e) {}
}

verify().catch(console.error);
