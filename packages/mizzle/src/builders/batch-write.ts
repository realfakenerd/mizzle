import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { BaseBuilder } from "./base";
import type { IMizzleClient } from "../core/client";

export type BatchWriteOperation<TEntity extends Entity> = 
    | { type: "put", item: InferInsertModel<TEntity> }
    | { type: "delete", keys: Partial<InferInsertModel<TEntity>> };

export interface BatchWriteResult<T> {
    succeededCount: number;
    failed: any[]; // Operations that failed after all retries
}

export class BatchWriteBuilder {
    constructor(private client: IMizzleClient) {}

    operations<TEntity extends Entity>(entity: TEntity, ops: BatchWriteOperation<TEntity>[]) {
        return new BatchWriteBase(entity, this.client, ops);
    }
}

class BatchWriteBase<
    TEntity extends Entity,
> extends BaseBuilder<TEntity, BatchWriteResult<InferInsertModel<TEntity>>> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "BatchWriteBase";

    constructor(
        entity: TEntity,
        client: IMizzleClient,
        private ops: BatchWriteOperation<TEntity>[],
    ) {
        super(entity, client);
    }

    override async execute(): Promise<BatchWriteResult<InferInsertModel<TEntity>>> {
        let succeededCount = 0;
        let failed: any[] = [];

        const requests = this.ops.map(op => {
            if (op.type === "put") {
                return {
                    PutRequest: {
                        Item: op.item as Record<string, unknown>
                    }
                };
            } else {
                return {
                    DeleteRequest: {
                        Key: op.keys as Record<string, unknown>
                    }
                };
            }
        });

        let currentRequests = [...requests];
        let attempts = 0;
        const maxBatchAttempts = 5;

        while (currentRequests.length > 0 && attempts < maxBatchAttempts) {
            attempts++;
            
            const command = new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: currentRequests
                }
            });

            const response = await this.client.send(command);
            
            const unprocessed = response.UnprocessedItems?.[this.tableName] || [];
            succeededCount += (currentRequests.length - unprocessed.length);

            if (unprocessed.length > 0) {
                currentRequests = unprocessed;
            } else {
                currentRequests = [];
            }
        }

        if (currentRequests.length > 0) {
            failed = currentRequests;
        }

        return { succeededCount, failed };
    }
}
