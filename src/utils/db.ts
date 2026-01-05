import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "../builders/insert";
import { RelationnalQueryBuilder } from "../builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "../builders/select";
import type { Entity, InferInsertModel } from "../core/table";
import { UpdateBuilder } from "../builders/update";
import { DeleteBuilder } from "../builders/delete";

/**
 * DynamoDB database instance.
 */
export class DynamoDB {
    private docClient: DynamoDBDocumentClient;
    private relations?: Record<string, any>;

    constructor(client: DynamoDBClient, relations?: Record<string, any>) {
        this.docClient = DynamoDBDocumentClient.from(client);
        this.relations = relations;
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
     * Start a relational query.
     */
    query<T extends Entity>(table: T) {
        return new RelationnalQueryBuilder<any>(this.docClient, table as any);
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
        return new DeleteBuilder(table, this.docClient, keys);
    }
}

/**
 * Configuration for initializing Mizzle.
 */
export interface MizzleConfig {
    /**
     * AWS DynamoDB Client.
     */
    client: DynamoDBClient;
    /**
     * Relational schema definition.
     */
    relations?: Record<string, any>;
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
export function mizzle(config: DynamoDBClient | MizzleConfig) {
    if (config instanceof DynamoDBClient) {
        return new DynamoDB(config);
    }
    return new DynamoDB(config.client, config.relations);
}
