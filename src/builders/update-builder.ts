import {
    UpdateCommand,
    type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import type { Condition } from "../expressions/operators";
import type { InferInsertModel } from "../core/table";

export class UpdateBuilder<T extends TableDefinition<any>> {
    #key?: Record<string, any>;
    #where?: Condition;
    #setValues: Partial<InferInsertModel<T>> = {};
    #addValues: AtomicValues<T> = {};
    #removeKeys: string[] = [];
    #returnValues: "NONE" | "ALL_NEW" | "UPDATED_NEW" = "NONE";

    constructor(
        private client: DynamoDBDocumentClient,
        private table: T,
    ) {}

    key(keyParams: any) {
        this.#key = keyParams;
        return this;
    }

    set(values: Partial<InferInsertModel<T>>) {
        this.#setValues = { ...this.#setValues, ...values };
        return this;
    }

    add(values: AtomicValues<T>) {
        this.#addValues = { ...this.#addValues, ...values };
        return this;
    }

    remove(keys: (keyof T["_builders"])[]) {
        this.#removeKeys.push(...(keys as string[]));
        return this;
    }

    where(condition: Condition) {
        this.#where = condition;
        return this;
    }

    returning(val: "NONE" | "ALL_NEW" | "UPDATED_NEW") {
        this.#returnValues = val;
        return this;
    }

    async execute(): Promise<InferSelectedModel<T>> {
        const { tableName, columns } = this.table;

        let pkPhisicalName: string | undefined;

        for (const col of Object.values(columns)) {
            if (col.config.isPrimaryKey) {
                pkPhisicalName = col.name;
                break;
            }
        }

        if (!pkPhisicalName) {
            throw new Error(
                `Table ${tableName} does not have an Partition Key defined`,
            );
        }

        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};
        let valueCount = 0;

        const addName = (name: string) => {
            const key = `#up_${name}`;
            expressionAttributeNames[key] = name;
            return key;
        };

        const addValue = (val: any) => {
            const key = `:up_v${++valueCount}`;
            expressionAttributeValues[key] = val;
            return key;
        };

        // --- Montando a UpdateExpression ---
        const clauses: string[] = [];

        // SET Clause
        const setParts: string[] = [];
        for (const [key, value] of Object.entries(this.#setValues)) {
            if (value !== undefined) {
                setParts.push(`${addName(key)} = ${addValue(value)}`);
            }
        }

        if (setParts.length > 0) {
            clauses.push(`SET ${setParts.join(", ")}`);
        }

        // ADD Clause
        const addParts: string[] = [];
        for (const [key, value] of Object.entries(this.#addValues)) {
            if (value !== undefined) {
                addParts.push(`${addName(key)} ${addValue(value)}`);
            }
        }
        if (addParts.length > 0) {
            clauses.push(`ADD ${addParts.join(", ")}`);
        }

        // REMOVE Clause
        if (this.#removeKeys.length > 0) {
            const removeParts = this.#removeKeys.map((k) => addName(k));
            clauses.push(`REMOVE ${removeParts.join(", ")}`);
        }

        const updateExpression = clauses.join(" ");

        const keyObj: any = {};

        // Vamos fazer uma extração simples da PK para o exemplo funcionar:
        if (
            this.#where &&
            this.#where.type === "binary" &&
            this.#where.column === pkPhisicalName &&
            this.#where.operator === "="
        ) {
            keyObj[pkPhisicalName] = this.#where.value;
        } else {
            throw new Error(
                "Para update, o .where() deve conter uma igualdade simples na Chave Primária.",
            );
        }

        const command = new UpdateCommand({
            TableName: tableName,
            Key: keyObj,
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: this.#returnValues,
        });

        const result = await this.client.send(command);
        return result.Attributes as InferSelectedModel<T>;
    }
}
