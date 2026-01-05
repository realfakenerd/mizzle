import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "../builders/insert";
import { RelationnalQueryBuilder } from "../builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "../builders/select";
import type { Entity, InferInsertModel } from "../core/table";
import { UpdateBuilder } from "../builders/update";
import { DeleteBuilder } from "../builders/delete";
import { extractMetadata, type InternalRelationalSchema } from "../core/relations";

export type QuerySchema<TSchema extends Record<string, any>> = {
    [K in keyof TSchema as TSchema[K] extends Entity ? K : never]: RelationnalQueryBuilder<TSchema[K]>;
};

/**
 * DynamoDB database instance.
 */
export class DynamoDB<TSchema extends Record<string, any> = Record<string, any>> {
    private docClient: DynamoDBDocumentClient;
    private schema?: InternalRelationalSchema;

    /**
     * Access relational queries for entities defined in the schema.
     * 
     * @example
     * ```ts
     * const users = await db.query.users.findMany();
     * ```
     */
    public readonly query: QuerySchema<TSchema>;

    constructor(client: DynamoDBClient, relations?: TSchema) {
        this.docClient = DynamoDBDocumentClient.from(client);
        
        if (relations) {
            this.schema = extractMetadata(relations);
        }

        this.query = new Proxy({} as any, {
            get: (_, prop) => {
                if (typeof prop !== 'string') return undefined;

                if (!this.schema) {
                    throw new Error("No relations defined. Initialize mizzle with a relations object to use db.query.");
                }

                const entityMetadata = this.schema.entities[prop];
                if (!entityMetadata) {
                    throw new Error(`Entity ${prop} not found in relations schema.`);
                }

                return new RelationnalQueryBuilder(this.docClient, entityMetadata.entity);
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
     * Start a relational query manually for a specific entity.
     * @internal
     */
    _query<T extends Entity>(table: T) {
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
export interface MizzleConfig<TSchema extends Record<string, any> = Record<string, any>> {
    /**
     * AWS DynamoDB Client.
     */
    client: DynamoDBClient;
    /**
     * Relational schema definition.
     */
    relations?: TSchema;
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
export function mizzle<TSchema extends Record<string, any> = Record<string, any>>(
    config: DynamoDBClient | MizzleConfig<TSchema>
): DynamoDB<TSchema> {
    if (config instanceof DynamoDBClient) {
        return new DynamoDB(config);
    }
    return new DynamoDB(config.client, config.relations);
}
