import { SelectBase } from './select';
import { operators, type Operators, eq, and } from '../expressions/operators';
import { type Condition, Expression } from '../expressions/operators';
import type { Entity, InferSelectedModel } from '../core/table';
import { ItemCollectionParser } from '../core/parser';
import type { InternalRelationalSchema } from '../core/relations';
import { resolveStrategies } from '../core/strategies';
import { TABLE_SYMBOLS, ENTITY_SYMBOLS, mapToLogical } from "@mizzle/shared";
import { Column } from '../core/column';
import { type IMizzleClient } from '../core/client';

type WhereCallback<T extends Entity> = (
        fields: T['_']['columns'],
        ops: Operators
) => Condition;

/**
 * Options for selecting related entities.
 */
export type IncludeOptions = boolean | {
        where?: Condition;
        limit?: number;
        with?: Record<string, IncludeOptions>;
        include?: Record<string, IncludeOptions>;
};

/**
 * Options for a relational query.
 */
export type RelationalQueryOptions<T extends Entity> = {
        where?: Condition | WhereCallback<T>;
        limit?: number;
        orderBy?: 'asc' | 'desc';
        /**
         * Select relationships to include (Drizzle-style).
         */
        with?: Record<string, IncludeOptions>;
        /**
         * Select relationships to include (Prisma-style).
         */
        include?: Record<string, IncludeOptions>;
};

export type InferRelationalModel<
    T extends Entity,
    TOptions extends RelationalQueryOptions<T> = Record<string, never>
> = InferSelectedModel<T> & {
    [K in keyof TOptions['with'] & string]: unknown; 
} & {
    [K in keyof TOptions['include'] & string]: unknown;
};

export class RelationnalQueryBuilder<T extends Entity> {
        constructor(
                private client: IMizzleClient,
                private table: T,
                private schema?: InternalRelationalSchema,
                private entityName?: string
        ) {}

        async findFirst<TOptions extends RelationalQueryOptions<T>>(
                options: TOptions = {} as TOptions
        ): Promise<InferRelationalModel<T, TOptions> | undefined> {
                const results = await this.findMany({ ...options, limit: 1 });
                return results[0];
        }

        async findMany<TOptions extends RelationalQueryOptions<T>>(
        options: TOptions = {} as TOptions
    ): Promise<InferRelationalModel<T, TOptions>[]> {
                const qb = new SelectBase<T, undefined>(this.table, this.client, undefined);

                if (options.orderBy) {
                        qb.sort(options.orderBy === 'asc');
                }

                let condition: Condition | undefined;

                if (options.where) {
                        const columns = (this.table._?.columns || (this.table as unknown as Record<string, Column>)) as Record<string, Column>;
                        if (typeof options.where === 'function') {
                                condition = (options.where as WhereCallback<T>)(columns as any, operators);
                        } else {
                                condition = options.where as Condition;
                        }
                }

                let results: Record<string, unknown>[];

                // Single-Table Optimization (Direct PK)
                const resolution = resolveStrategies(this.table, condition);

                if (this.schema && this.entityName && (options.with || options.include) && resolution.hasPartitionKey && !resolution.indexName) {
                        const physicalTable = this.table[ENTITY_SYMBOLS.PHYSICAL_TABLE];
                        const pkPhysicalName = (physicalTable[TABLE_SYMBOLS.PARTITION_KEY] as Column).name;
                        
                        const pkValue = resolution.keys[pkPhysicalName];

                        // Override where to ONLY use the PK to get related items in the same collection
                        qb.where(eq({ name: pkPhysicalName } as Column, pkValue));

                        const rawItems = await qb.execute();
                        
                        // Map physical attributes back to logical names for the parser
                        // We need a helper since we are not inheriting from BaseBuilder here
                        const logicalItems = rawItems.map(item => mapToLogical(this.table, item));

                        const parser = new ItemCollectionParser(this.schema);
                        results = parser.parse(logicalItems as any, this.entityName, (options.with || options.include) as Record<string, boolean | object>);

                        if (options.limit) {
                                results = results.slice(0, options.limit);
                        }
                } else {
                        if (options.limit) {
                                qb.limit(options.limit);
                        }
                        if (condition) {
                                qb.where(condition);
                        }
                        results = await qb.execute();
                }

                // Recursive relation fetching
                if (this.schema && this.entityName && (options.with || options.include)) {
                        const relationsToFetch = (options.with || options.include) as Record<string, IncludeOptions>;
                        
                        await Promise.all(results.map(async (result) => {
                                for (const [relName, relOptions] of Object.entries(relationsToFetch)) {
                                        const relation = this.schema!.entities[this.entityName!].relations[relName];
                                        if (!relation) continue;

                                        // If already populated AND no nested relations requested, skip.
                                        // This preserves items from ItemCollectionParser (Single-Table optimization).
                                        const isAlreadyPopulated = result[relName] !== undefined;
                                        const hasNestedRelations = typeof relOptions === 'object' && (relOptions.with || relOptions.include);
                                        
                                        if (isAlreadyPopulated && !hasNestedRelations) continue;

                                        const targetEntity = relation.config.to;
                                        const targetEntityName = Object.entries(this.schema!.entities).find(([_, m]) => m.entity === targetEntity)?.[0];

                                        // Map result to logical names for target strategy resolution
                                        const logicalValues = mapToLogical(this.table, result);

                                        let finalLogicalValues = logicalValues;
                                        if (relation.config.fields && relation.config.references) {
                                                const mappedValues: Record<string, unknown> = {};
                                                relation.config.fields.forEach((fieldCol, idx) => {
                                                        const refCol = relation.config.references![idx];
                                                        const targetLogicalEntry = Object.entries(targetEntity[ENTITY_SYMBOLS.COLUMNS] as Record<string, Column>)
                                                                .find(([_, c]) => c === refCol || c.name === refCol.name);
                                                        
                                                        const targetLogicalName = targetLogicalEntry?.[0];
                                                        
                                                        if (targetLogicalName) {
                                                                const sourceLogicalName = Object.entries(this.table[ENTITY_SYMBOLS.COLUMNS] as Record<string, Column>)
                                                                        .find(([_, c]) => c === fieldCol || c.name === fieldCol.name)?.[0];
                                                                
                                                                const val = sourceLogicalName ? (result[sourceLogicalName] ?? result[fieldCol.name]) : result[fieldCol.name];
                                                                if (val !== undefined) {
                                                                        mappedValues[targetLogicalName] = val;
                                                                }
                                                        }
                                                });
                                                finalLogicalValues = mappedValues;
                                        }

                                        // Build keys for Query/GetItem based on parent item's data
                                        const targetRes = resolveStrategies(targetEntity, undefined, finalLogicalValues);
                                        if (targetRes.hasPartitionKey) {
                                                const targetQb = new RelationnalQueryBuilder(this.client, targetEntity, this.schema, targetEntityName);
                                                
                                                // Construct where clause from resolved keys using physical names directly
                                                const whereParts: Expression[] = [];
                                                for (const [physName, value] of Object.entries(targetRes.keys)) {
                                                        whereParts.push(eq({ name: physName } as Column, value));
                                                }
                                                
                                                if (whereParts.length > 0) {
                                                        const finalWhere = whereParts.length === 1 ? whereParts[0] : and(...whereParts);
                                                        const nextOptions = typeof relOptions === 'object' ? relOptions : {};

                                                        if (relation.type === 'one') {
                                                                result[relName] = await targetQb.findFirst({ ...nextOptions, where: finalWhere });
                                                        } else {
                                                                // Overwrite for 'many' to ensure we get nested relations if requested.
                                                                // Optimization: only overwrite if we really need to (e.g. cross-partition).
                                                                result[relName] = await targetQb.findMany({ ...nextOptions, where: finalWhere });
                                                        }
                                                }
                                        }
                                }
                        }));
                }

                                return results as InferRelationalModel<T, TOptions>[];

                        }

                }

                