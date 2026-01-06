import { RELATION_SYMBOLS } from "../constants";
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
 * Callback function to define relations.
 */
export type RelationsCallback<TEntity extends Entity = Entity> = (helpers: {
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
 * Define relations for an entity.
 * 
 * @example
 * ```ts
 * export const usersRelations = defineRelations(users, ({ many }) => ({
 *   posts: many(posts),
 * }));
 * ```
 */
export function defineRelations<TEntity extends Entity>(
    entity: TEntity,
    relations: RelationsCallback<TEntity>
): RelationsDefinition<TEntity> {
    const config = relations({
        one: (to, config) => new Relation("one", { to, ...config }),
        many: (to, config) => new Relation("many", { to, ...config }),
    });

    return {
        entity,
        config,
        [RELATION_SYMBOLS.RELATION_CONFIG]: true
    } as any;
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
export function extractMetadata(schema: Record<string, any>): InternalRelationalSchema {
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
    for (const [key, value] of Object.entries(schema)) {
        if (value && value[RELATION_SYMBOLS.RELATION_CONFIG]) {
            const definition = value as RelationsDefinition;
            // Find the key for this entity in the metadata
            const entityEntry = Object.entries(metadata.entities).find(
                ([_, meta]) => meta.entity === definition.entity
            );

            if (entityEntry) {
                const [entityName, meta] = entityEntry;
                meta.relations = {
                    ...meta.relations,
                    ...definition.config,
                };
            }
        }
    }

    return metadata;
}
