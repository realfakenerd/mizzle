import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "./command-builder/insert";
import { RelationnalQueryBuilder } from "./relational-builder";
import type { SelectedFields } from "./select-builder";
import { SelectBuilder } from "./select-builder";
import type { Entity } from "./table";
import { UpdateBuilder } from "./update-builder";

export class DynamoDB {
    private docClient: DynamoDBDocumentClient;

    constructor(client: DynamoDBClient) {
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    insert<T extends Entity>(table: T): InsertBuilder<T> {
        return new InsertBuilder(table, this.docClient);
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
