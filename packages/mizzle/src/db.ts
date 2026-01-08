import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "./builders/insert";
import { RelationnalQueryBuilder } from "./builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "./builders/select";
import type { Entity, InferInsertModel, InferSelectModel } from "./core/table";
import { UpdateBuilder } from "./builders/update";
import { DeleteBuilder } from "./builders/delete";
import { BatchGetBuilder } from "./builders/batch-get";
import { BatchWriteBuilder, type BatchWriteOperation } from "./builders/batch-write";
import { extractMetadata, type InternalRelationalSchema } from "./core/relations";
import { RetryHandler, type RetryConfig } from "./core/retry";
import { MizzleClient, type IMizzleClient } from "./core/client";

export type QuerySchema<TSchema extends Record<string, unknown>> = {
    [K in keyof TSchema as TSchema[K] extends Entity ? K : never]: RelationnalQueryBuilder<TSchema[K] extends Entity ? TSchema[K] : never>;
};

/**
 * DynamoDB database instance.
 */
export class DynamoDB<TSchema extends Record<string, unknown> = Record<string, unknown>> {
    private docClient: IMizzleClient;
    private schema?: InternalRelationalSchema;
    private retryConfig: RetryConfig;

    /**
     * Access relational queries for entities defined in the schema.
     * 
     * @example
     * ```ts
     * const users = await db.query.users.findMany();
     * ```
     */
    public readonly query: QuerySchema<TSchema>;

    constructor(client: DynamoDBClient, relations?: TSchema, retry?: Partial<RetryConfig>) {
        this.retryConfig = {
            maxAttempts: retry?.maxAttempts ?? 3,
            baseDelay: retry?.baseDelay ?? 100,
        };
        this.docClient = new MizzleClient(
            DynamoDBDocumentClient.from(client),
            new RetryHandler(this.retryConfig)
        );
        
        if (relations) {
            this.schema = extractMetadata(relations);
        }

        this.query = new Proxy({} as QuerySchema<TSchema>, {
            get: (_, prop) => {
                if (typeof prop !== 'string') return undefined;

                if (!this.schema) {
                    throw new Error("No relations defined. Initialize mizzle with a relations object to use db.query.");
                }

                const entityMetadata = this.schema.entities[prop];
                if (!entityMetadata) {
                    throw new Error(`Entity ${prop} not found in relations schema.`);
                }

                return new RelationnalQueryBuilder(this.docClient, entityMetadata.entity, this.schema, prop);
            }
        });
    }

    /**
     * Insert a new record into the database.
     */
    insert<T extends Entity>(table: T): InsertBuilder<T> {
        return new InsertBuilder(table, this.docClient);
    }

    /**
     * Select records from the database.
     */
    select<TSelection extends SelectedFields>(
        fields?: TSelection,
    ): SelectBuilder<TSelection | undefined> {
        return new SelectBuilder(this.docClient, fields);
    }

    /**
     * Batch get items from the database.
     */
    batchGet<T extends Entity>(
        entity: T,
        keys: Partial<InferSelectModel<T>>[],
    ) {
        return new BatchGetBuilder(this.docClient).items(entity, keys);
    }

    /**
     * Batch write items to the database.
     */
    batchWrite<T extends Entity>(
        entity: T,
        operations: BatchWriteOperation<T>[],
    ) {
        return new BatchWriteBuilder(this.docClient).operations(entity, operations);
    }

    /**
     * Start a relational query manually for a specific entity.
     * @internal
     */
    _query<T extends Entity>(table: T) {
        return new RelationnalQueryBuilder<T>(this.docClient, table);
    }

    /**
     * Update existing records in the database.
     */
    update<T extends Entity>(table: T): UpdateBuilder<T> {
        return new UpdateBuilder(table, this.docClient);
    }

    /**
     * Delete records from the database.
     */
    delete<T extends Entity>(
        table: T,
        keys: Partial<InferInsertModel<T>>,
    ): DeleteBuilder<T> {
        return new DeleteBuilder(table, this.docClient, keys as Record<string, unknown>);
    }
}

/**
 * Configuration for initializing Mizzle.
 */
export interface MizzleConfig<TSchema extends Record<string, unknown> = Record<string, unknown>> {
    /**
     * AWS DynamoDB Client.
     */
    client: DynamoDBClient;
    /**
     * Relational schema definition.
     */
    relations?: TSchema;
    /**
     * Retry configuration for transient errors.
     */
    retry?: Partial<RetryConfig>;
}

/**
 * Initialize Mizzle with a DynamoDB client or a configuration object.
 * 
 * @example
 * ```ts
 * const db = mizzle(client);
 * // or
 * const db = mizzle({ client, relations });
 * ```
 */
export function mizzle<TSchema extends Record<string, unknown> = Record<string, unknown>>(
    config: DynamoDBClient | MizzleConfig<TSchema>
): DynamoDB<TSchema> {
    if (config instanceof DynamoDBClient) {
        return new DynamoDB(config);
    }
    
    if ("client" in config && config.client instanceof DynamoDBClient) {
        return new DynamoDB(config.client, config.relations, config.retry);
    }
    // Fallback for cases where instanceof might fail due to multiple SDK versions
    if ("client" in config && config.client) {
        return new DynamoDB(config.client as DynamoDBClient, config.relations, config.retry);
    }
    return new DynamoDB(config as unknown as DynamoDBClient);
}
