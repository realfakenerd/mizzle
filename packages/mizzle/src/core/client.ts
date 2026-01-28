import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { RetryHandler } from "./retry";

// We define a simplified interface for what we need from the client to avoid complex generic matching
export interface IMizzleClient {
  send(command: unknown, options?: unknown): Promise<unknown>;
}

export class MizzleClient implements IMizzleClient {
  constructor(
    private client: DynamoDBDocumentClient,
    private retryHandler: RetryHandler,
  ) {}

  send(command: unknown, options?: unknown): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.retryHandler.execute(() => this.client.send(command as any, options as any));
  }
}
