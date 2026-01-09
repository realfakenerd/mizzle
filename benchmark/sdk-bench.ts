import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
    DynamoDBDocumentClient, 
    PutCommand, 
    GetCommand, 
    UpdateCommand, 
    DeleteCommand, 
    QueryCommand, 
    ScanCommand 
} from "@aws-sdk/lib-dynamodb";
import { TABLE_NAME, REGION, ENDPOINT } from "./env";
import type { BenchmarkItem } from "./data-gen";

export class AWSSDKBench {
    private docClient: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        this.tableName = process.env.MIZZLE_BENCH_TABLE || TABLE_NAME;
        const client = new DynamoDBClient({
            region: REGION,
            endpoint: ENDPOINT,
            credentials: {
                accessKeyId: "local",
                secretAccessKey: "local",
            },
        });
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    async putItem(item: BenchmarkItem): Promise<void> {
        await this.docClient.send(
            new PutCommand({
                TableName: this.tableName,
                Item: item,
            })
        );
    }

    async getItem(pk: string, sk: string): Promise<BenchmarkItem | undefined> {
        const response = await this.docClient.send(
            new GetCommand({
                TableName: this.tableName,
                Key: { pk, sk },
            })
        );
        return response.Item as BenchmarkItem | undefined;
    }

    async updateItem(pk: string, sk: string, updates: Partial<BenchmarkItem>): Promise<void> {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        Object.entries(updates).forEach(([key, value], index) => {
            const attrName = `#field${index}`;
            const attrValue = `:val${index}`;
            updateExpressions.push(`${attrName} = ${attrValue}`);
            expressionAttributeNames[attrName] = key;
            expressionAttributeValues[attrValue] = value;
        });

        await this.docClient.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { pk, sk },
                UpdateExpression: `SET ${updateExpressions.join(", ")}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
            })
        );
    }

    async deleteItem(pk: string, sk: string): Promise<void> {
        await this.docClient.send(
            new DeleteCommand({
                TableName: this.tableName,
                Key: { pk, sk },
            })
        );
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const response = await this.docClient.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: {
                    ":pk": pk,
                },
            })
        );
        return (response.Items as BenchmarkItem[]) || [];
    }

    async scanItems(): Promise<BenchmarkItem[]> {
        const response = await this.docClient.send(
            new ScanCommand({
                TableName: this.tableName,
            })
        );
        return (response.Items as BenchmarkItem[]) || [];
    }
}
