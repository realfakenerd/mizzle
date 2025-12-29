import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "../builders/insert";
import { RelationnalQueryBuilder } from "../builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "../builders/select";
import type { Entity } from "../core/table";
import { UpdateBuilder } from "../builders/update-builder";

export class DynamoDB {
    private docClient: DynamoDBDocumentClient;

    constructor(client: DynamoDBClient) {
        this.docClient = DynamoDBDocumentClient.from(client);
    }

    insert<T extends Entity>(table: T): InsertBuilder<T> {
        return new InsertBuilder(table, this.docClient);
    }

    select<TSelection extends SelectedFields>(
        fields?: TSelection,
    ): SelectBuilder<TSelection | undefined> {
        return new SelectBuilder(this.docClient, fields);
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
