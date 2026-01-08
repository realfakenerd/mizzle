import {
	DynamoDBDocumentClient,
	QueryCommand,
	ScanCommand,
	type QueryCommandInput,
	type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { type Condition, BinaryExpression, LogicalExpression } from '../expressions/operators';
import type { InferSelectedModel, Entity } from '../core/table';
import { ENTITY_SYMBOLS, TABLE_SYMBOLS, resolveTableName } from '@mizzle/shared';
import { resolveStrategies } from '../core/strategies';
import { Column } from '../core/column';

export class DynamoQueryBuilder<T extends Entity> {
	private whereClause?: Condition;
	private limitVal?: number;
	private projectionFields?: string[];
	private sortForward: boolean = true;
	private indexName?: string;

	constructor(
		private client: DynamoDBDocumentClient,
		private table: T
	) {}

	// Define a condição
	where(condition: Condition) {
		this.whereClause = condition;
		return this; // Fluent interface
	}

	limit(val: number) {
		this.limitVal = val;
		return this;
	}

	sort(forward: boolean) {
		this.sortForward = forward;
		return this;
	}

	index(name: string) {
		this.indexName = name;
		return this;
	}

	setProjection(cols: string[]) {
		this.projectionFields = cols;
		return this;
	}

	// Executa a query
	async execute(): Promise<InferSelectedModel<T>[]> {
		const tableName = resolveTableName(this.table);
		
		const resolution = resolveStrategies(this.table, this.whereClause, undefined, this.indexName);

		// Estado para montar a query do Dynamo
		const expressionAttributeNames: Record<string, string> = {};
		const expressionAttributeValues: Record<string, unknown> = {};
		let valueCounter = 0;

		const addValue = (val: unknown) => {
			const key = `:v${++valueCounter}`;
			expressionAttributeValues[key] = val;
			return key;
		};

		const addName = (name: string) => {
			const key = `#${name}`;
			expressionAttributeNames[key] = name;
			return key;
		};

		// Função recursiva para transformar Condition -> String do Dynamo
		const buildExpression = (cond: Condition): string => {
			if (cond instanceof LogicalExpression) {
				const parts = cond.conditions.map(buildExpression);
				return `(${parts.join(` ${cond.operator} `)})`;
			}

			if (cond instanceof BinaryExpression) {
				const colNameStr = cond.column.name;
				const colName = addName(colNameStr);

				if (cond.operator === 'begins_with') {
					const valKey = addValue(cond.value);
					return `begins_with(${colName}, ${valKey})`;
				}

				if (cond.operator === 'between') {
					const valArray = cond.value as unknown[];
					const valKey1 = addValue(valArray[0]);
					const valKey2 = addValue(valArray[1]);
					return `${colName} BETWEEN ${valKey1} AND ${valKey2}`;
				}

				if (cond.operator === 'in') {
					const valArray = cond.value as unknown[];
					const valKeys = valArray.map(val => addValue(val));
					return `${colName} IN (${valKeys.join(', ')})`;
				}

				const valKey = addValue(cond.value);
				return `${colName} ${cond.operator} ${valKey}`;
			}
			return '';
		};

		// --- Lógica de Decisão: Query vs Scan ---

		let keyConditionExpression = '';
		let filterExpression = '';
		const isQuery = resolution.hasPartitionKey;
		
				if (isQuery) {
                    let pkName: string;
                    let skName: string | undefined;

                    if (resolution.indexName) {
                        const pt = this.table[ENTITY_SYMBOLS.PHYSICAL_TABLE];
                        const indexes = pt[TABLE_SYMBOLS.INDEXES];
                        const index = indexes?.[resolution.indexName] as { config: { pk: string; sk?: string } } | undefined;
                        if (!index) throw new Error(`Index ${resolution.indexName} not found`);
                        pkName = index.config.pk;
                        skName = index.config.sk;
                    } else {
                        const pt = this.table[ENTITY_SYMBOLS.PHYSICAL_TABLE];
                        pkName = (pt[TABLE_SYMBOLS.PARTITION_KEY] as Column).name;
                        skName = (pt[TABLE_SYMBOLS.SORT_KEY] as Column | undefined)?.name;
                    }

                    const pkValue = resolution.keys[pkName];
                    keyConditionExpression = `${addName(pkName)} = ${addValue(pkValue)}`;

                    if (resolution.hasSortKey && skName && resolution.keys[skName] !== undefined) {
                        keyConditionExpression += ` AND ${addName(skName)} = ${addValue(resolution.keys[skName])}`;
                    }
                } else {
                    if (this.whereClause) {
                        filterExpression = buildExpression(this.whereClause);
                    }
                }
		
				const params: QueryCommandInput | ScanCommandInput = {
					TableName: tableName,
					Limit: this.limitVal,
					IndexName: this.indexName
				};

		if (this.projectionFields && this.projectionFields.length > 0) {
			const projExprs = this.projectionFields.map((col) => addName(col));
			params.ProjectionExpression = projExprs.join(', ');
		}

		if (Object.keys(expressionAttributeNames).length > 0) {
			params.ExpressionAttributeNames = expressionAttributeNames;
		}

		if (Object.keys(expressionAttributeValues).length > 0) {
			params.ExpressionAttributeValues = expressionAttributeValues;
		}

		let command: QueryCommand | ScanCommand;
		if (isQuery) {
			const queryParams = params as QueryCommandInput;
			queryParams.KeyConditionExpression = keyConditionExpression;
			queryParams.ScanIndexForward = this.sortForward;
			if (filterExpression) queryParams.FilterExpression = filterExpression;

			command = new QueryCommand(queryParams);
		} else {
			if (filterExpression) params.FilterExpression = filterExpression;
			command = new ScanCommand(params);
		}

		const result = await this.client.send(command);
		return (result.Items as InferSelectedModel<T>[]) || [];
	}
}
