import { DynamoQueryBuilder } from './query-builder';
import { operators, type Operators, eq } from '../expressions/operators';
import type { Condition } from '../expressions/operators';
import type { Entity, InferSelectedModel } from '../core/table';
import { ItemCollectionParser } from '../core/parser';
import type { InternalRelationalSchema } from '../core/relations';
import { resolveStrategies } from '../core/strategies';
import { TABLE_SYMBOLS } from "@mizzle/shared";
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

	async findMany<TOptions extends RelationalQueryOptions<T>>(
        options: TOptions = {} as TOptions
    ): Promise<InferRelationalModel<T, TOptions>[]> {
		const qb = new DynamoQueryBuilder<T>(this.client, this.table);

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
			const pkName = Object.keys(resolution.keys).find(k => {
				const pt = this.table._?.table;
				const physicalPKName = (pt?.[TABLE_SYMBOLS.PARTITION_KEY] as Column | undefined)?.name;
                return k === physicalPKName;
			}) || Object.keys(resolution.keys)[0];
			const pkValue = resolution.keys[pkName!];

			// Override where to ONLY use the PK to get related items in the same collection
			qb.where(eq({ name: pkName! } as Column, pkValue));

			// NOTE: We DON'T apply options.limit here because we need the related items.
			// Instead, we fetch the whole collection and limit the results later.

			const rawItems = await qb.execute();
			const parser = new ItemCollectionParser(this.schema);
			results = parser.parse(rawItems, this.entityName, (options.with || options.include) as Record<string, boolean | object>);
			
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

		// Secondary relations (GSI or Cross-Partition)
		if (this.schema && this.entityName && (options.with || options.include)) {
			const relationsToFetch = (options.with || options.include || {}) as Record<string, IncludeOptions>;
			const entityMeta = this.schema.entities[this.entityName];

            if (entityMeta) {
                // Execute fetching for all results in parallel
                await Promise.all(results.map(async (result) => {
                    for (const [relName, relOption] of Object.entries(relationsToFetch)) {
                        if (!relOption) continue;
                        
                        // If it's already an array with items or a non-null object, it was fetched via optimization
                        const currentValue = result[relName];
                        const isPopulated = currentValue !== undefined && (
                            (Array.isArray(currentValue) && currentValue.length > 0) || 
                            (typeof currentValue === "object" && currentValue !== null && !Array.isArray(currentValue))
                        );

                        if (isPopulated) continue;

                        const relConfig = entityMeta.relations[relName];
                        if (!relConfig) continue;

                        // Map fields from the current item to the target entity's columns
                        const targetValues: Record<string, unknown> = { ...result };
                        if (relConfig.config.fields && relConfig.config.references) {
                            for (let i = 0; i < relConfig.config.fields.length; i++) {
                                const sourceCol = relConfig.config.fields[i];
                                const targetCol = relConfig.config.references[i];
                                if (sourceCol && targetCol) {
                                    targetValues[targetCol.name] = result[sourceCol.name];
                                }
                            }
                        }

                        // Try to resolve keys for the target entity using mapped fields
                        const targetEntity = relConfig.config.to;
                        const targetRes = resolveStrategies(targetEntity, undefined, targetValues);

                        if (targetRes.hasPartitionKey) {
                            // We can fetch this relation!
                            const targetQb = new DynamoQueryBuilder(this.client, targetEntity);
                            
                            if (targetRes.indexName) {
                                targetQb.index(targetRes.indexName);
                            }

                            const pkNameInTarget = Object.keys(targetRes.keys).find(k => {
                                const pt = targetEntity._?.table;
                                const pkFromMeta = (pt?.[TABLE_SYMBOLS.PARTITION_KEY] as Column | undefined)?.name;
                                
                                if (targetRes.indexName) {
                                    const indexes = pt?.[TABLE_SYMBOLS.INDEXES];
                                    const index = indexes?.[targetRes.indexName] as { config: { pk: string; sk?: string } } | undefined;
                                    return index && k === index.config.pk;
                                }
                                
                                return k === pkFromMeta;
                            }) || Object.keys(targetRes.keys)[0];

                            // Use the actual target entity column if we can find it
                            const targetColumns = (targetEntity._?.columns as Record<string, Column> || (targetEntity as unknown as Record<string, Column>)) as Record<string, Column>;
                            const pkColumn = Object.values(targetColumns).find((c) => c.name === pkNameInTarget) || ({ name: pkNameInTarget } as Column);

                            const targetCondition = eq(pkColumn, targetRes.keys[pkNameInTarget!]);
                            targetQb.where(targetCondition);

                            const relatedItems = await targetQb.execute();
                            
                            if (relConfig.type === "many") {
                                result[relName] = relatedItems;
                            } else {
                                result[relName] = relatedItems[0] || null;
                            }
                        }
                    }
                }));
            }
		}

		return results as unknown as InferRelationalModel<T, TOptions>[];
	}

	async findFirst<TOptions extends RelationalQueryOptions<T>>(
        options: TOptions = {} as TOptions
    ): Promise<InferRelationalModel<T, TOptions> | undefined> {
		const res = await this.findMany({ ...options, limit: 1 });
		return res[0];
	}
}
