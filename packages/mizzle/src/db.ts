import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "./builders/insert";
import { RelationnalQueryBuilder } from "./builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "./builders/select";
import type { BaseBuilder } from "./builders/base";
import type { Entity, InferInsertModel, InferSelectModel } from "./core/table";
import { UpdateBuilder } from "./builders/update";
import { DeleteBuilder } from "./builders/delete";
import { BatchGetBuilder } from "./builders/batch-get";
import { BatchWriteBuilder, type BatchWriteOperation } from "./builders/batch-write";
import { TransactionProxy } from "./builders/transaction";
import { extractMetadata, type InternalRelationalSchema, type MultiRelationsDefinition } from "./core/relations";
import { RetryHandler, type RetryConfig } from "./core/retry";
import { MizzleClient, type IMizzleClient } from "./core/client";

export type QuerySchema<TSchema extends Record<string, any>> = TSchema extends MultiRelationsDefinition<
  infer T
>
  ? {
      [K in keyof T]: RelationnalQueryBuilder<T[K]>;
    }
  : {
      [K in keyof TSchema as TSchema[K] extends Entity ? K : never]: RelationnalQueryBuilder<
        TSchema[K] extends Entity ? TSchema[K] : never
      >;
    };

/**
 * DynamoDB database instance.
 */
export class DynamoDB<TSchema extends Record<string, any> = Record<string, any>> {
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
      new RetryHandler(this.retryConfig),
    );

    if (relations) {
      this.schema = extractMetadata(relations);
    }

    this.query = new Proxy({} as QuerySchema<TSchema>, {
      get: (_, prop) => {
        if (typeof prop !== "string") return undefined;

        if (!this.schema) {
          throw new Error(
            "No relations defined. Initialize mizzle with a relations object to use db.query.",
          );
        }

        const entityMetadata = this.schema.entities[prop];
        if (!entityMetadata) {
          throw new Error(`Entity ${prop} not found in relations schema.`);
        }

        return new RelationnalQueryBuilder(
          this.docClient,
          entityMetadata.entity,
          this.schema,
          prop,
        );
      },
    });
  }

  /**
   * Insert a new record into the database.
   *
   * @example
   * ```ts
   * await db.insert(users).values({ id: "1", name: "Alice" }).execute();
   * ```
   *
   * @param table The entity definition to insert into.
   * @returns An InsertBuilder instance.
   */
  insert<T extends Entity>(table: T): InsertBuilder<T> {
    return new InsertBuilder(table, this.docClient);
  }

  /**
   * Select records from the database.
   *
   * @example
   * ```ts
   * const results = await db.select().from(users).where(eq(users.id, "1")).execute();
   * ```
   *
   * @param fields Optional specific fields to select. If omitted, all fields are returned.
   * @returns A SelectBuilder instance.
   */
  select<TSelection extends SelectedFields>(
    fields?: TSelection,
  ): SelectBuilder<TSelection | undefined> {
    return new SelectBuilder(this.docClient, fields);
  }

  /**
   * Batch get multiple items from the database in a single request.
   *
   * @example
   * ```ts
   * const items = await db.batchGet(users, [{ id: "1" }, { id: "2" }]).execute();
   * ```
   *
   * @param entity The entity definition.
   * @param keys An array of primary key objects to fetch.
   * @returns A BatchGetBuilder instance.
   */
  batchGet<T extends Entity>(entity: T, keys: Partial<InferSelectModel<T>>[]) {
    return new BatchGetBuilder(this.docClient).items(entity, keys);
  }

  /**
   * Batch write (insert or delete) multiple items in a single request.
   *
   * @example
   * ```ts
   * await db.batchWrite(users, [
   *   { type: "put", item: { id: "1", name: "Alice" } },
   *   { type: "delete", key: { id: "2" } }
   * ]).execute();
   * ```
   *
   * @param entity The entity definition.
   * @param operations An array of batch operations.
   * @returns A BatchWriteBuilder instance.
   */
  batchWrite<T extends Entity>(entity: T, operations: BatchWriteOperation<T>[]) {
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
   *
   * @example
   * ```ts
   * await db.update(users).set({ name: "Bob" }).where(eq(users.id, "1")).execute();
   * ```
   *
   * @param table The entity definition to update.
   * @returns An UpdateBuilder instance.
   */
  update<T extends Entity>(table: T): UpdateBuilder<T> {
    return new UpdateBuilder(table, this.docClient);
  }

  /**
   * Delete records from the database.
   *
   * @example
   * ```ts
   * await db.delete(users, { id: "1" }).execute();
   * ```
   *
   * @param table The entity definition to delete from.
   * @param keys The primary key(s) of the item to delete.
   * @returns A DeleteBuilder instance.
   */
  delete<T extends Entity>(table: T, keys: Partial<InferInsertModel<T>>): DeleteBuilder<T> {
    return new DeleteBuilder(table, this.docClient, keys as Record<string, unknown>);
  }

  /**
   * Execute multiple operations atomically in a single DynamoDB transaction.
   *
   * @example
   * ```ts
   * await db.transaction("unique-token", (tx) => [
   *   tx.insert(users).values({ id: "1", name: "Alice" }),
   *   tx.update(stats).set({ count: sql`${stats.count} + 1` }).where(eq(stats.id, "global"))
   * ]);
   * ```
   *
   * @param token A unique client request token for idempotency.
   * @param callback A function that receives a transaction proxy and returns an array of operations.
   * @returns A promise that resolves when the transaction completes.
   * @throws Error if the transaction is cancelled or fails.
   */
  async transaction(
    token: string,
    callback: (
      tx: TransactionProxy,
    ) => BaseBuilder<Entity, unknown>[] | Promise<BaseBuilder<Entity, unknown>[]>,
  ): Promise<void> {
    const proxy = new TransactionProxy(this.docClient);
    const operations = await callback(proxy);

    if (operations.length === 0) return;
    if (operations.length > 100) {
      throw new Error("DynamoDB transactions are limited to 100 items.");
    }

    // Executor will be implemented in transaction.ts
    const { TransactionExecutor } = await import("./builders/transaction");
    const executor = new TransactionExecutor(this.docClient);
    await executor.execute(token, operations);
  }
}

/**
 * Configuration for initializing Mizzle.
 */
export interface MizzleConfig<TSchema extends Record<string, any> = Record<string, any>> {
  /**
   * AWS DynamoDB Client instance from `@aws-sdk/client-dynamodb`.
   */
  client: DynamoDBClient;
  /**
   * Relational schema definition for using `db.query`.
   */
  relations?: TSchema;
  /**
   * Optional retry configuration for transient DynamoDB errors.
   */
  retry?: Partial<RetryConfig>;
}

/**
 * Initializes a Mizzle database instance.
 *
 * @example
 * ```ts
 * // Basic initialization
 * const db = mizzle(new DynamoDBClient({}));
 *
 * // Initialization with relational schema
 * const db = mizzle({
 *   client: new DynamoDBClient({}),
 *   relations: { users, posts }
 * });
 * ```
 *
 * @param config A DynamoDBClient instance or a MizzleConfig object.
 * @returns A DynamoDB instance for performing database operations.
 */
export function mizzle<TSchema extends Record<string, any> = Record<string, any>>(
  config: DynamoDBClient | MizzleConfig<TSchema>,
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
