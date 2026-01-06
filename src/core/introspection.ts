import { DynamoDBClient, ListTablesCommand, DescribeTableCommand, TableDescription } from "@aws-sdk/client-dynamodb";
import { MizzleSnapshot, TableSnapshot } from "./snapshot";

export async function getRemoteSnapshot(client: DynamoDBClient): Promise<MizzleSnapshot> {
    const tables: Record<string, TableSnapshot> = {};
    
    // List Tables
    let lastEvaluatedTableName: string | undefined;
    const tableNames: string[] = [];
    do {
        const response = await client.send(new ListTablesCommand({ ExclusiveStartTableName: lastEvaluatedTableName }));
        if (response.TableNames) tableNames.push(...response.TableNames);
        lastEvaluatedTableName = response.LastEvaluatedTableName;
    } while (lastEvaluatedTableName);

    // Describe each table
    for (const tableName of tableNames) {
        try {
            const response = await client.send(new DescribeTableCommand({ TableName: tableName }));
            if (response.Table) {
                const snap = convertDescriptionToSnapshot(response.Table);
                tables[tableName] = snap;
            }
        } catch (e) {
            console.warn(`Failed to describe table ${tableName}:`, e);
        }
    }

    return {
        version: "remote",
        tables
    };
}

function convertDescriptionToSnapshot(desc: TableDescription): TableSnapshot {
    // Map DescribeTableOutput to TableSnapshot
    const result: TableSnapshot = {
        TableName: desc.TableName!,
        AttributeDefinitions: desc.AttributeDefinitions?.map(ad => ({
            AttributeName: ad.AttributeName!,
            AttributeType: ad.AttributeType!
        })).sort((a, b) => a.AttributeName.localeCompare(b.AttributeName)) || [],
        KeySchema: desc.KeySchema?.map(ks => ({
            AttributeName: ks.AttributeName!,
            KeyType: ks.KeyType as "HASH" | "RANGE"
        })) || []
    };

    if (desc.GlobalSecondaryIndexes && desc.GlobalSecondaryIndexes.length > 0) {
        result.GlobalSecondaryIndexes = desc.GlobalSecondaryIndexes.map(gsi => ({
            IndexName: gsi.IndexName!,
            KeySchema: gsi.KeySchema?.map(ks => ({
                AttributeName: ks.AttributeName!,
                KeyType: ks.KeyType as "HASH" | "RANGE"
            })),
            Projection: gsi.Projection ? { ProjectionType: gsi.Projection.ProjectionType } : undefined
        })).sort((a, b) => a.IndexName.localeCompare(b.IndexName));
    }

    if (desc.LocalSecondaryIndexes && desc.LocalSecondaryIndexes.length > 0) {
        result.LocalSecondaryIndexes = desc.LocalSecondaryIndexes.map(lsi => ({
            IndexName: lsi.IndexName!,
            KeySchema: lsi.KeySchema?.map(ks => ({
                AttributeName: ks.AttributeName!,
                KeyType: ks.KeyType as "HASH" | "RANGE"
            })),
            Projection: lsi.Projection ? { ProjectionType: lsi.Projection.ProjectionType } : undefined
        })).sort((a, b) => a.IndexName.localeCompare(b.IndexName));
    }

    return result;
}
