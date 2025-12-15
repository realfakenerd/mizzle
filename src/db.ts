import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { RelationnalQueryBuilder } from "./relational-builder";
import type { SelectedFields } from "./select-builder";
import { SelectBuilder } from "./select-builder";
import type { InferInsertModel, InferSelectModel } from "./table";
import { UpdateBuilder } from "./update-builder";

const isSet = (val: any): val is Set<any> => val instanceof Set;

export class DynamoDB<
    TFullSchema extends Record<string, unknown> = Record<string, unknown>,
    TSchema,
> {
    private docClient: DynamoDBDocumentClient;

    query: {
        [K in keyof TSchema]: {};
    };

    constructor(client: DynamoDBClient) {
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    insert<T extends TableDefinition<any>>(table: T) {
        return {
            values: async (
                values: InferInsertModel<T>,
            ): Promise<InferSelectModel<T>> => {
                const itemToSave: any = { ...values };

                for (const [key, col] of Object.entries(table.columns)) {
                    const config = col.config;
                    let value = itemToSave[key];

                    if (value === undefined) {
                        if (config.default) {
                            itemToSave[key] = config.default;
                        }

                        if (config.defaultFn) {
                            itemToSave[key] = config.defaultFn();
                        }

                        if (config.onUpdateFn) {
                            itemToSave[key] = config.onUpdateFn();
                        }
                    }
                    const finalValue = itemToSave[key];

                    if (["SS", "NS", "BS"].includes(config.dataType)) {
                        if (Array.isArray(value)) {
                            value = new Set(value);
                            itemToSave[key] = value;

                            if (isSet(value) && value.size === 0) {
                                delete itemToSave[key];
                            }
                        }
                    }

                    if (finalValue !== undefined) {
                        if (config.dataType === "N") {
                            if (
                                config.validators?.min !== undefined &&
                                finalValue < config.validators.min
                            ) {
                                throw new Error(
                                    `Campo '${key}' deve ser >= ${config.validators.min}`,
                                );
                            }
                            if (
                                config.validators?.max !== undefined &&
                                finalValue > config.validators.max
                            ) {
                                throw new Error(
                                    `Campo '${key}' deve ser <= ${config.validators.max}`,
                                );
                            }
                        }

                        if (config.dataType === "S") {
                            if (
                                config.validators?.length !== undefined &&
                                finalValue.length !== config.validators.length
                            ) {
                                throw new Error(
                                    `Campo '${key}' deve ter tamanho exato de ${config.validators.length}`,
                                );
                            }
                            // Exemplo simples de email check
                            if (
                                config.validators?.email &&
                                !finalValue.includes("@")
                            ) {
                                throw new Error(
                                    `Campo '${key}' deve ser um email válido`,
                                );
                            }
                        }
                    }
                }

                const command = new PutCommand({
                    TableName: table.tableName,
                    Item: itemToSave,
                });

                await this.docClient.send(command);
                return itemToSave;
            },
        };
    }

    select(): SelectBuilder<undefined>;
    select<TSelection extends SelectedFields>(
        fields: TSelection,
    ): SelectBuilder<TSelection>;
    select<TSelection extends SelectedFields>(
        fields?: TSelection,
    ): SelectBuilder<TSelection | undefined> {
        return new SelectBuilder({
            fields: fields ?? undefined,
        });
    }

    query<T extends TableDefinition<any>>(table: T) {
        return new RelationnalQueryBuilder<T>(this.docClient, table);
    }

    update<T extends TableDefinition<any>>(table: T) {
        const update_builder = new UpdateBuilder<T>(this.docClient, table);

        return update_builder;
    }
}

export function mizzle(client: DynamoDBClient) {
    return new DynamoDB(client);
}
