import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoQueryBuilder } from './query-builder';
import { operators, type Operators, eq } from '../expressions/operators';
import type { Condition } from '../expressions/operators';
import type { Entity, InferSelectedModel } from '../core/table';
import { ItemCollectionParser } from '../core/parser';
import type { InternalRelationalSchema } from '../core/relations';
import { resolveStrategies } from '../core/strategies';
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from '../constants';

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

export class RelationnalQueryBuilder<T extends Entity> {
	constructor(
		private client: DynamoDBDocumentClient,
		private table: T,
		private schema?: InternalRelationalSchema,
		private entityName?: string
	) {}

	async findMany(options: RelationalQueryOptions<T> = {}): Promise<InferSelectedModel<T>[]> {
		const qb = new DynamoQueryBuilder<T>(this.client, this.table);

		if (options.limit) {
			qb.limit(options.limit);
		}

		if (options.orderBy) {
			qb.sort(options.orderBy === 'asc');
		}

		const columns = this.table._?.columns || (this.table as any).columns || this.table;
		let condition: Condition | undefined;

		if (options.where) {
			if (typeof options.where === 'function') {
				condition = options.where(columns, operators);
			} else {
				condition = options.where;
			}
		}

		let results: any[];

		// Single-Table Optimization (Direct PK)
		const resolution = resolveStrategies(this.table, condition);

		if (this.schema && this.entityName && (options.with || options.include) && resolution.hasPartitionKey && !resolution.indexName) {
			const pkName = Object.keys(resolution.keys).find(k => {
				const pt = this.table._?.table || (this.table as any)[ENTITY_SYMBOLS.PHYSICAL_TABLE];
				return k === (pt?._?.partitionKey?.name || pt?.[TABLE_SYMBOLS.PARTITION_KEY]?.name);
			}) || Object.keys(resolution.keys)[0];
			const pkValue = resolution.keys[pkName];

			// Override where to ONLY use the PK to get related items in the same collection
			qb.where(eq({ name: pkName } as any, pkValue));

			const rawItems = await qb.execute();
			const parser = new ItemCollectionParser(this.schema);
			results = parser.parse(rawItems, this.entityName, options.with || options.include);
		} else {
			if (condition) {
				qb.where(condition);
			}
			results = await qb.execute();
		}

		// Secondary relations (GSI or Cross-Partition)
		if (this.schema && this.entityName && (options.with || options.include)) {
			const relationsToFetch = options.with || options.include || {};
			const entityMeta = this.schema.entities[this.entityName];

			for (const result of results) {
				for (const [relName, relOption] of Object.entries(relationsToFetch)) {
					if (!relOption) continue;
					
					// If it's already an array with items or a non-null object, it was likely fetched via optimization
					const currentValue = result[relName];
					const isPopulated = currentValue !== undefined && (
						(Array.isArray(currentValue) && currentValue.length > 0) || 
						(typeof currentValue === "object" && currentValue !== null && !Array.isArray(currentValue))
					);

					if (isPopulated) continue;

					const relConfig = entityMeta.relations[relName];
					if (!relConfig) continue;

					// Map fields from the current item to the target entity's columns
					const targetValues: Record<string, any> = { ...result };
					if (relConfig.config.fields && relConfig.config.references) {
						for (let i = 0; i < relConfig.config.fields.length; i++) {
							const sourceCol = relConfig.config.fields[i];
							const targetCol = relConfig.config.references[i];
							targetValues[targetCol.name] = result[sourceCol.name];
						}
					}

					// Try to resolve keys for the related entity using mapped fields
					const targetEntity = relConfig.config.to;
					const targetRes = resolveStrategies(targetEntity, undefined, targetValues);

					if (targetRes.hasPartitionKey) {
						// We can fetch this relation!
						const targetQb = new DynamoQueryBuilder(this.client, targetEntity);
						
						if (targetRes.indexName) {
							targetQb.index(targetRes.indexName);
						}

						const pkNameInTarget = Object.keys(targetRes.keys).find(k => {
							const pt = targetEntity._?.table || (targetEntity as any)[ENTITY_SYMBOLS.PHYSICAL_TABLE];
							const ptMeta = pt?._ || pt;
							const pkFromMeta = ptMeta.partitionKey?.name || ptMeta[TABLE_SYMBOLS.PARTITION_KEY]?.name;
							
							if (targetRes.indexName) {
								const index = ptMeta.config?.indexes?.[targetRes.indexName] || ptMeta[TABLE_SYMBOLS.INDEXES]?.[targetRes.indexName];
								return k === index.config.pk;
							}
							
							return k === pkFromMeta;
						}) || Object.keys(targetRes.keys)[0];

						// Use the actual target entity column if we can find it
						const targetColumns = targetEntity._?.columns || (targetEntity as any).columns || targetEntity;
						const pkColumn = Object.values(targetColumns).find((c: any) => c.name === pkNameInTarget) || { name: pkNameInTarget };

						const targetCondition = eq(pkColumn as any, targetRes.keys[pkNameInTarget]);
						targetQb.where(targetCondition);

						const relatedItems = await targetQb.execute();
						
						if (relConfig.type === "many") {
							result[relName] = relatedItems;
						} else {
							result[relName] = relatedItems[0] || null;
						}
					}
				}
			}
		}

		return results;
	}

	async findFirst(options: RelationalQueryOptions<T> = {}): Promise<InferSelectedModel<T> | undefined> {
		const res = await this.findMany({ ...options, limit: 1 });
		return res[0];
	}
}