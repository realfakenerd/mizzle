import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RetryHandler } from "./retry";

// We define a simplified interface for what we need from the client to avoid complex generic matching
export interface IMizzleClient {
    send(command: any, options?: any): Promise<any>;
}

export class MizzleClient implements IMizzleClient {
    constructor(
        private client: DynamoDBDocumentClient,
        private retryHandler: RetryHandler
    ) {}

    send(command: any, options?: any): Promise<any> {
        return this.retryHandler.execute(() => this.client.send(command, options));
    }
}
