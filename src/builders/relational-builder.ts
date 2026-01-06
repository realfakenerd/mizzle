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

		// Single-Table Optimization
		if (this.schema && this.entityName && (options.with || options.include)) {
			const resolution = resolveStrategies(this.table, condition);

			if (resolution.hasPartitionKey) {
				// We have a Partition Key, we can fetch the whole collection
				const pkName = Object.keys(resolution.keys).find(k => {
					const pt = this.table._?.table || (this.table as any)[ENTITY_SYMBOLS.PHYSICAL_TABLE];
					return k === (pt?._?.partitionKey?.name || pt?.[TABLE_SYMBOLS.PARTITION_KEY]?.name);
				}) || Object.keys(resolution.keys)[0];
				const pkValue = resolution.keys[pkName];

				// Override where to ONLY use the PK to get related items in the same collection
				qb.where(eq({ name: pkName } as any, pkValue));

				const rawItems = await qb.execute();
				const parser = new ItemCollectionParser(this.schema);
				return parser.parse(rawItems, this.entityName, options.with || options.include);
			}
		}

		if (condition) {
			qb.where(condition);
		}

		return qb.execute();
	}

	async findFirst(options: RelationalQueryOptions<T> = {}): Promise<InferSelectedModel<T> | undefined> {
		const res = await this.findMany({ ...options, limit: 1 });
		return res[0];
	}
}
