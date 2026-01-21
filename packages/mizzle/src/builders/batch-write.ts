import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferInsertModel } from "../core/table";
import { BaseBuilder } from "./base";
import type { IMizzleClient } from "../core/client";
import { calculateItemSize } from "../core/validation";
import { ItemSizeExceededError } from "../core/errors";

export type BatchWriteOperation<TEntity extends Entity> = 
    | { type: "put", item: InferInsertModel<TEntity> }
    | { type: "delete", keys: Partial<InferInsertModel<TEntity>> };

export interface BatchWriteResult<_T> {
    succeededCount: number;
    failed: unknown[]; // Operations that failed after all retries
}

export class BatchWriteBuilder {
    constructor(private client: IMizzleClient) {}

    operations<TEntity extends Entity>(entity: TEntity, ops: BatchWriteOperation<TEntity>[]) {
        return new BatchWriteBase(entity, this.client, ops);
    }
}

export class BatchWriteBase<
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

    public override async execute(): Promise<BatchWriteResult<InferInsertModel<TEntity>>> {
        let succeededCount = 0;
        let failed: unknown[] = [];

        const requests = this.ops.map(op => {
            if (op.type === "put") {
                const item = op.item as Record<string, unknown>;
                
                // Size validation
                const size = calculateItemSize(item);
                if (size > 400 * 1024) {
                    throw new ItemSizeExceededError(`Item in batch exceeds the 400KB limit.`);
                }

                return {
                    PutRequest: {
                        Item: item
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

        let currentRequests: unknown[] = [...requests];
        let attempts = 0;
        const maxBatchAttempts = 5;

        while (currentRequests.length > 0 && attempts < maxBatchAttempts) {
            attempts++;
            
            const command = new BatchWriteCommand({
                RequestItems: {
                    [this.tableName]: currentRequests as Record<string, unknown>[]
                }
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await this.client.send(command) as { UnprocessedItems?: Record<string, any[]> };
            
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
