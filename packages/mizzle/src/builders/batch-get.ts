import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "@mizzle/shared";
import { Entity, type InferSelectModel } from "../core/table";
import { BaseBuilder } from "./base";
import type { IMizzleClient } from "../core/client";

export class BatchGetBuilder {
    constructor(private client: IMizzleClient) {}

    items<TEntity extends Entity>(entity: TEntity, keys: Partial<InferSelectModel<TEntity>>[]) {
        return new BatchGetBase(entity, this.client, keys);
    }
}

export interface BatchGetResult<T> {
    succeeded: T[];
    failed: Partial<T>[];
}

class BatchGetBase<
    TEntity extends Entity,
    TResult = InferSelectModel<TEntity>,
> extends BaseBuilder<TEntity, BatchGetResult<TResult>> {
    static readonly [ENTITY_SYMBOLS.ENTITY_KIND]: string = "BatchGetBase";

    constructor(
        entity: TEntity,
        client: IMizzleClient,
        private keysData: Partial<InferSelectModel<TEntity>>[],
    ) {
        super(entity, client);
    }

    override async execute(): Promise<BatchGetResult<TResult>> {
        const succeeded: TResult[] = [];
        const failed: Record<string, unknown>[] = [];

        // Group keys by resolved DynamoDB keys
        let currentKeys = this.keysData.map(k => this.resolveKeys(undefined, k as Record<string, unknown>).keys);
        
        let attempts = 0;
        const maxBatchAttempts = 5; // Internal limit for unprocessed retries

        while (currentKeys.length > 0 && attempts < maxBatchAttempts) {
            attempts++;
            
            const command = new BatchGetCommand({
                RequestItems: {
                    [this.tableName]: {
                        Keys: currentKeys
                    }
                }
            });

            const response = await this.client.send(command);
            
            if (response.Responses?.[this.tableName]) {
                succeeded.push(...(response.Responses[this.tableName] as TResult[]));
            }

            const unprocessed = response.UnprocessedKeys?.[this.tableName]?.Keys;
            
            if (unprocessed && unprocessed.length > 0) {
                currentKeys = unprocessed as Record<string, unknown>[];
            } else {
                currentKeys = [];
            }
        }

        if (currentKeys.length > 0) {
            failed.push(...currentKeys);
        }

        return { succeeded, failed: failed as any[] };
    }
}
