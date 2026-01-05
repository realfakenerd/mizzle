import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoQueryBuilder } from './query-builder';
import { operators, type Operators } from '../expressions/operators';
import type { Condition } from '../expressions/operators';
import type { Entity, InferSelectedModel } from '../core/table';

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
		private table: T
	) {}

	async findMany(options: RelationalQueryOptions<T> = {}): Promise<InferSelectedModel<T>[]> {
		const qb = new DynamoQueryBuilder<T>(this.client, this.table);

		if (options.limit) {
			qb.limit(options.limit);
		}

		if (options.orderBy) {
			qb.sort(options.orderBy === 'asc');
		}

		if (options.where) {
			let condition: Condition;

			if (typeof options.where === 'function') {
				const columns = this.table._?.columns || (this.table as any).columns || this.table;
				condition = options.where(columns, operators);
			} else {
				condition = options.where;
			}

			qb.where(condition);
		}

		return qb.execute();
	}

	async findFirst(options: RelationalQueryOptions<T> = {}): Promise<InferSelectedModel<T> | undefined> {
		const res = await this.findMany({ ...options, limit: 1 });
		return res[0];
	}
}
