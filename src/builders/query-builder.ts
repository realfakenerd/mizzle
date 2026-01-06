import {
	DynamoDBDocumentClient,
	QueryCommand,
	ScanCommand,
	type QueryCommandInput,
	type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import type { Condition } from '../expressions/operators';
import type { InferSelectedModel, Entity } from '../core/table';
import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from '../constants';
import { resolveTableName } from '../utils/utils';
import { resolveStrategies } from '../core/strategies';

export class DynamoQueryBuilder<T extends Entity<any>> {
	private whereClause?: Condition;
	private limitVal?: number;
	private projectionFields?: string[];
	private sortForward: boolean = true;

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

	setProjection(cols: string[]) {
		this.projectionFields = cols;
		return this;
	}

	// Executa a query
	async execute(): Promise<InferSelectedModel<T>[]> {
		const table = this.table as any;
		const tableName = resolveTableName(this.table);
		const entityName = table[ENTITY_SYMBOLS.ENTITY_NAME] || (table as any).tableName;
		
		const resolution = resolveStrategies(this.table, this.whereClause);

		// Estado para montar a query do Dynamo
		const expressionAttributeNames: Record<string, string> = {};
		const expressionAttributeValues: Record<string, any> = {};
		let valueCounter = 0;

		const addValue = (val: any) => {
			const key = `:v${++valueCounter}`;
			(expressionAttributeValues as any)[key] = val;
			return key;
		};

		const addName = (name: string) => {
			const key = `#${name}`;
			(expressionAttributeNames as any)[key] = name;
			return key;
		};

		const getColName = (colRef: string | { name: string }) =>
			typeof colRef === 'string' ? colRef : colRef.name;

		        // Função recursiva para transformar Condition -> String do Dynamo
				const buildExpression = (cond: Condition): string => {
					const c = cond as any;
					if (c.type === 'logical' && c.conditions) {
						const parts = c.conditions.map(buildExpression);
						return `(${parts.join(` ${c.operator} `)})`;
					}
		
					if (c.type === 'binary' && c.column) {
						const colNameStr = getColName(c.column);
						const colName = addName(colNameStr);

						if (c.operator === 'begins_with') {
							const valKey = addValue(c.value);
							return `begins_with(${colName}, ${valKey})`;
						}

						if (c.operator === 'between') {
							const valKey1 = addValue(c.value[0]);
							const valKey2 = addValue(c.value[1]);
							return `${colName} BETWEEN ${valKey1} AND ${valKey2}`;
						}

						if (c.operator === 'in') {
							const valKeys = (c.value as any[]).map(val => addValue(val));
							return `${colName} IN (${valKeys.join(', ')})`;
						}

						const valKey = addValue(c.value);
						return `${colName} ${c.operator} ${valKey}`;
					}
					return '';
				};
		
				// --- Lógica de Decisão: Query vs Scan ---
		
				let keyConditionExpression = '';
				let filterExpression = '';
				let isQuery = resolution.hasPartitionKey;
		
				if (isQuery) {
                    const pkName = Object.keys(resolution.keys).find(k => {
                        const pt = table._?.table || table[ENTITY_SYMBOLS.PHYSICAL_TABLE];
                        return k === (pt?._?.partitionKey?.name || pt?.[TABLE_SYMBOLS.PARTITION_KEY]?.name);
                    }) || Object.keys(resolution.keys)[0];

                    const pkValue = resolution.keys[pkName];
                    keyConditionExpression = `${addName(pkName)} = ${addValue(pkValue)}`;

                    if (resolution.hasSortKey) {
                        const skName = Object.keys(resolution.keys).find(k => k !== pkName);
                        if (skName) {
                            const skValue = resolution.keys[skName];
                            keyConditionExpression += ` AND ${addName(skName)} = ${addValue(skValue)}`;
                        }
                    }
                } else {
                    if (this.whereClause) {
                        filterExpression = buildExpression(this.whereClause);
                    }
                }
		
				const params: QueryCommandInput | ScanCommandInput = {
					TableName: tableName,
					Limit: this.limitVal as number | undefined
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
			(params as QueryCommandInput).KeyConditionExpression = keyConditionExpression;
			(params as QueryCommandInput).ScanIndexForward = this.sortForward;
			if (filterExpression) params.FilterExpression = filterExpression;

			command = new QueryCommand(params);
		} else {
			if (filterExpression) params.FilterExpression = filterExpression;
			command = new ScanCommand(params);
		}

		const result = await this.client.send(command);
		return (result.Items as InferSelectedModel<T>[]) || [];
	}
}