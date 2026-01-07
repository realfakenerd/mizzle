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
import { BenchmarkItem } from "./data-gen";

export class AWSSDKBench {
    private docClient: DynamoDBDocumentClient;

    constructor() {
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
                TableName: TABLE_NAME,
                Item: item,
            })
        );
    }

    async getItem(pk: string, sk: string): Promise<BenchmarkItem | undefined> {
        const response = await this.docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
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
                TableName: TABLE_NAME,
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
                TableName: TABLE_NAME,
                Key: { pk, sk },
            })
        );
    }

    async queryItems(pk: string): Promise<BenchmarkItem[]> {
        const response = await this.docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
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
                TableName: TABLE_NAME,
            })
        );
        return (response.Items as BenchmarkItem[]) || [];
    }
}
