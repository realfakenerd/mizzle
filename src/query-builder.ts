import {
	DynamoDBDocumentClient,
	QueryCommand,
	ScanCommand,
	type QueryCommandInput,
	type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import type { Condition } from './operators';
import type { InferSelectedModel, TableDefinition } from './table';

export class DynamoQueryBuilder<T extends TableDefinition<any>> {
	private whereClause?: Condition;
	private limitVal?: number;
	private projectionFields?: string[];

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

	setProjection(cols: string[]) {
		this.projectionFields = cols;
		return this;
	}

	// Executa a query
	async execute(): Promise<InferSelectedModel<T>[]> {
		const { tableName, columns } = this.table;

		let pkPhisicalName: string | undefined;

		for (const col of Object.values(columns)) {
			if (col.config.isPrimaryKey) {
				pkPhisicalName = col.name;
				break;
			}
		}

		if (!pkPhisicalName) {
			throw new Error(`Table ${tableName} does not have an Partition Key defined`);
		}

		// Estado para montar a query do Dynamo
		const expressionAttributeNames: Record<`#${string}`, string> = {};
		const expressionAttributeValues: Record<`:v${string}`, any> = {};
		let valueCounter = 0;

		const addValue = (val: any) => {
			const key = `:v${++valueCounter}`;
			expressionAttributeValues[key] = val;
			return key;
		};

		const addName = (name: string) => {
			const key = `#${name}`;
			expressionAttributeNames[key] = name;
			return key;
		};

		const getColName = (colRef: string | { name: string }) =>
			typeof colRef === 'string' ? colRef : colRef.name;

		// Função recursiva para transformar Condition -> String do Dynamo
		const buildExpression = (cond: Condition): string => {
			if (cond.type === 'logical' && cond.conditions) {
				const parts = cond.conditions.map(buildExpression);
				return `(${parts.join(` ${cond.operator} `)})`;
			}

			if (cond.type === 'binary' && cond.column) {
				const colNameStr = getColName(cond.column);
				const colName = addName(colNameStr);
				const valKey = addValue(cond.value);

				if (cond.operator === 'begins_with') {
					return `begins_with(${colName}, ${valKey})`;
				}
				return `${colName} ${cond.operator} ${valKey}`;
			}
			return '';
		};

		// --- Lógica de Decisão: Query vs Scan ---

		let keyConditionExpression = '';
		let filterExpression = '';
		let isQuery = false;

		// Simplificação: Se for um 'eq' simples na PK, é Query.
		// Se for um 'and', verificamos se um dos filhos é PK.
		// (Uma implementação completa varreria a árvore de condições recursivamente)

		if (this.whereClause) {
			const cond = this.whereClause;

			// Verifica se é uma igualdade simples na PK
			const isPkEquality = (c: Condition) =>
				c.type === 'binary' && c.operator === '=' && getColName(c.column!) === pkPhisicalName;

			if (isPkEquality(cond)) {
				isQuery = true;
				keyConditionExpression = buildExpression(cond);
			} else if (cond.type === 'logical' && cond.operator === 'AND' && cond.conditions) {
				// Procura a condição da PK dentro do AND
				const pkCondIndex = cond.conditions.findIndex(isPkEquality);

				if (pkCondIndex !== -1) {
					isQuery = true;
					const pkCond = cond.conditions[pkCondIndex];
					keyConditionExpression = buildExpression(pkCond);

					// O resto vira FilterExpression
					const otherConds = cond.conditions.filter((_, i) => i !== pkCondIndex);
					if (otherConds.length > 0) {
						filterExpression = buildExpression({
							type: 'logical',
							operator: 'AND',
							conditions: otherConds
						});
					}
				} else {
					filterExpression = buildExpression(cond);
				}
			} else {
				filterExpression = buildExpression(cond);
			}
		}

		const params: QueryCommandInput | ScanCommandInput = {
			TableName: tableName,
			Limit: this.limitVal
		};

		if (this.projectionFields && this.projectionFields.length > 0) {
			console.log(this.projectionFields);

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
