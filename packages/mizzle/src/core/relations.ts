import { RELATION_SYMBOLS } from "@mizzle/shared";
import { Entity } from "./table";
import { Column } from "./column";

/**
 * Type of relationship.
 */
export type RelationType = "one" | "many";

/**
 * Configuration for a relationship.
 */
export interface RelationConfig {
    /**
     * The target entity of the relationship.
     */
    to: Entity;
    /**
     * Local columns that link to the target entity.
     */
    fields?: Column[];
    /**
     * Target columns that the local columns link to.
     */
    references?: Column[];
    /**
     * Optional name for the relation.
     */
    relationName?: string;
}

/**
 * Represents a relationship between entities.
 */
export class Relation<TType extends RelationType = RelationType> {
    constructor(
        public type: TType,
        public config: RelationConfig
    ) {}
}

/**
 * Definition of all relations for a single entity.
 */
export interface RelationsDefinition<TEntity extends Entity = Entity> {
    /**
     * The source entity.
     */
    entity: TEntity;
    /**
     * Map of relation names to their configurations.
     */
    config: Record<string, Relation>;
}

/**
 * Definition of relations for multiple entities in a schema.
 */
export interface MultiRelationsDefinition<TSchema extends Record<string, Entity> = Record<string, Entity>> {
    /**
     * The schema containing all entities.
     */
    schema: TSchema;
    /**
     * Map of entity names to their relation configurations.
     */
    definitions: {
        [K in keyof TSchema]?: Record<string, Relation>;
    };
}

/**
 * Helpers provided to the defineRelations callback.
 */
export type RelationsHelpers<TSchema extends Record<string, Entity>> = {
    /**
     * Define a one-to-one relationship.
     */
    one: {
        [K in keyof TSchema]: (config?: Omit<RelationConfig, "to">) => Relation<"one">;
    };
    /**
     * Define a one-to-many relationship.
     */
    many: {
        [K in keyof TSchema]: (config?: Omit<RelationConfig, "to">) => Relation<"many">;
    };
} & {
    /**
     * Access an entity in the schema to get its columns.
     */
    [K in keyof TSchema]: TSchema[K];
};

/**
 * Callback function to define relations for a single entity.
 */
export type RelationsCallback = (helpers: {
    /**
     * Define a one-to-one relationship.
     */
    one: (to: Entity, config?: Omit<RelationConfig, "to">) => Relation<"one">;
    /**
     * Define a one-to-many relationship.
     */
    many: (to: Entity, config?: Omit<RelationConfig, "to">) => Relation<"many">;
}) => Record<string, Relation>;

/**
 * Callback function to define relations for multiple entities.
 */
export type MultiRelationsCallback<TSchema extends Record<string, Entity>> = (
    helpers: RelationsHelpers<TSchema>
) => {
    [K in keyof TSchema]?: Record<string, Relation>;
};

/**
 * Defines relationships for a single entity.
 * 
 * @example
 * ```ts
 * export const usersRelations = defineRelations(users, ({ many }) => ({
 *   posts: many(posts),
 * }));
 * ```
 * 
 * @param entity The source entity.
 * @param relations A callback function to define relations using provided helpers.
 * @returns A relations definition for the entity.
 */
export function defineRelations<TEntity extends Entity>(
    entity: TEntity,
    relations: RelationsCallback
): RelationsDefinition<TEntity>;

/**
 * Defines relationships for multiple entities in a centralized schema-aware way.
 * This approach helps resolve circular dependencies between entities.
 * 
 * @example
 * ```ts
 * export const relations = defineRelations({ users, posts }, (r) => ({
 *   users: {
 *     posts: r.many.posts(),
 *   },
 *   posts: {
 *     author: r.one.users({
 *       fields: [r.posts.authorId],
 *       references: [r.users.id],
 *     }),
 *   },
 * }));
 * ```
 * 
 * @param schema An object mapping names to entity definitions.
 * @param relations A callback function to define relations for all entities in the schema.
 * @returns A multi-entity relations definition.
 */
export function defineRelations<TSchema extends Record<string, Entity>>(
    schema: TSchema,
    relations: MultiRelationsCallback<TSchema>
): MultiRelationsDefinition<TSchema>;

/**
 * Implementation of defineRelations.
 */
export function defineRelations(
    first: Entity | Record<string, Entity>,
    callback: RelationsCallback | MultiRelationsCallback<any>
): RelationsDefinition | MultiRelationsDefinition {
    if (first instanceof Entity) {
        // Single entity mode
        const cb = callback as RelationsCallback;
        const config = cb({
            one: (to: Entity, config?: Omit<RelationConfig, "to">) => new Relation("one", { to, ...config }),
            many: (to: Entity, config?: Omit<RelationConfig, "to">) => new Relation("many", { to, ...config }),
        });

        return {
            entity: first,
            config,
            [RELATION_SYMBOLS.RELATION_CONFIG]: true
        };
    } else {
        // Multi-entity mode
        const schema = first as Record<string, Entity>;
        const cb = callback as MultiRelationsCallback<typeof schema>;
        
        // Build helpers
        const helpers: Record<string, unknown> = {
            one: {},
            many: {},
        };

        for (const [key, entity] of Object.entries(schema)) {
            (helpers.one as Record<string, unknown>)[key] = (config?: Omit<RelationConfig, "to">) => new Relation("one", { to: entity, ...config });
            (helpers.many as Record<string, unknown>)[key] = (config?: Omit<RelationConfig, "to">) => new Relation("many", { to: entity, ...config });
            helpers[key] = entity;
        }

        const definitions = cb(helpers as unknown as RelationsHelpers<typeof schema>);

        return {
            schema,
            definitions: definitions as Record<string, Record<string, Relation>>,
            [RELATION_SYMBOLS.RELATION_CONFIG]: true
        };
    }
}

/**
 * Metadata for an entity and its relationships.
 */
export interface EntityMetadata {
    entity: Entity;
    relations: Record<string, Relation>;
}

/**
 * Internal relational schema mapping entity names to their metadata.
 */
export interface InternalRelationalSchema {
    entities: Record<string, EntityMetadata>;
}

/**
 * Extract metadata from a flat schema definition.
 */
export function extractMetadata(schema: Record<string, unknown>): InternalRelationalSchema {
    const metadata: InternalRelationalSchema = {
        entities: {},
    };

    // First pass: identify entities
    for (const [key, value] of Object.entries(schema)) {
        if (value instanceof Entity) {
            metadata.entities[key] = {
                entity: value,
                relations: {},
            };
        }
    }

    // Second pass: identify relations
    for (const [, value] of Object.entries(schema)) {
        if (value && typeof value === 'object' && (value as Record<string | symbol, unknown>)[RELATION_SYMBOLS.RELATION_CONFIG]) {
            const relationConfig = value as Record<string | symbol, unknown>;
            if (relationConfig.entity) {
                // Single entity definition
                const definition = value as RelationsDefinition;
                const entityEntry = Object.entries(metadata.entities).find(
                    ([_, meta]) => meta.entity === definition.entity
                );

                if (entityEntry) {
                    const [, meta] = entityEntry;
                    meta.relations = { ...meta.relations, ...definition.config };
                }
            } else if (relationConfig.definitions) {
                // Multi-entity definition
                const multiDef = value as MultiRelationsDefinition;
                for (const [entityName, relations] of Object.entries(multiDef.definitions)) {
                    // Try to find the entity in our metadata by matching the entity from the schema
                    const entityInSchema = multiDef.schema[entityName];
                    const metaEntry = Object.entries(metadata.entities).find(
                        ([_, meta]) => meta.entity === entityInSchema
                    );

                    if (metaEntry && relations) {
                        const [, meta] = metaEntry;
                        meta.relations = { ...meta.relations, ...relations };
                    }
                }
            }
        }
    }

    return metadata;
}
