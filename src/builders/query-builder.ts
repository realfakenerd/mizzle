import {
	DynamoDBDocumentClient,
	QueryCommand,
	ScanCommand,
	type QueryCommandInput,
	type ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import type { Condition } from '../expressions/operators';
import type { InferSelectedModel, TableDefinition } from '../core/table';
import { ENTITY_SYMBOLS } from '../constants';

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
		const table = this.table as any;
		const tableName = table[ENTITY_SYMBOLS.ENTITY_NAME] || (table as any).tableName;
		const columns = table[ENTITY_SYMBOLS.COLUMNS] || (table as any).columns;

		let pkPhisicalName: string | undefined;

		for (const col of Object.values(columns) as any[]) {
			if (col.config?.isPrimaryKey || col.isPrimaryKey) {
				pkPhisicalName = col.name;
				break;
			}
		}

		if (!pkPhisicalName) {
			throw new Error(`Table ${tableName} does not have an Partition Key defined`);
		}

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
						const valKey = addValue(c.value);
		
						if (c.operator === 'begins_with') {
							return `begins_with(${colName}, ${valKey})`;
						}
						return `${colName} ${c.operator} ${valKey}`;
					}
					return '';
				};
		
				// --- Lógica de Decisão: Query vs Scan ---
		
				let keyConditionExpression = '';
				let filterExpression = '';
				let isQuery = false;
		
				// Simplification: If it is a simple 'eq' in the PK, it is Query.
				// If it is an 'and', we check if one of the children is PK.
				// (A full implementation would traverse the condition tree recursively)
		
				if (this.whereClause) {
					const cond = this.whereClause;
		
					// Verifica se é uma igualdade simples na PK
					const isPkEquality = (c: Condition) => {
						const cc = c as any;
						return cc.type === 'binary' && cc.operator === '=' && getColName(cc.column!) === pkPhisicalName;
					};
		
					if (isPkEquality(cond)) {
						isQuery = true;
						keyConditionExpression = buildExpression(cond);
					} else if ((cond as any).type === 'logical' && (cond as any).operator === 'AND' && (cond as any).conditions) {
						// Procura a condição da PK dentro do AND
						const pkCondIndex = (cond as any).conditions.findIndex(isPkEquality);
		
						if (pkCondIndex !== -1) {
							isQuery = true;
							const pkCond = (cond as any).conditions[pkCondIndex];
							keyConditionExpression = buildExpression(pkCond);
		
							// O resto vira FilterExpression
							const otherConds = (cond as any).conditions.filter((_: any, i: number) => i !== pkCondIndex);
							if (otherConds.length > 0) {
								filterExpression = buildExpression({
									type: 'logical',
									operator: 'AND',
									conditions: otherConds
								} as any);
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
					Limit: this.limitVal as number | undefined
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
