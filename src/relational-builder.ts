import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoQueryBuilder } from './query-builder';
import { operators, type Operators } from './operators';
import type { Condition } from './operators';
import type { InferSelectedModel, TableDefinition } from './table';

type WhereCallback<T extends TableDefinition<any>> = (
	fields: T['columns'],
	ops: Operators
) => Condition;

type FindManyOptions<T extends TableDefinition<any>> = {
	where?: Condition | WhereCallback<T>;
	limit?: number;
};

export class RelationnalQueryBuilder<T extends TableDefinition<any>> {
	constructor(
		private client: DynamoDBDocumentClient,
		private table: T
	) {}

	async findMany(options: FindManyOptions<T> = {}): Promise<InferSelectedModel<T>[]> {
		const qb = new DynamoQueryBuilder<T>(this.client, this.table);

		if (options.limit) {
			qb.limit(options.limit);
		}

		if (options.where) {
			let condition: Condition;

			if (typeof options.where === 'function') {
				condition = options.where(this.table.columns, operators);
			} else {
				condition = options.where;
			}

			qb.where(condition);
		}

		return qb.execute();
	}

	async findFirst(options: FindManyOptions<T> = {}): Promise<InferSelectedModel<T> | undefined> {
		const res = await this.findMany({ ...options, limit: 1 });
		return res[0];
	}
}
