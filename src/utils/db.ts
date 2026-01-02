import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { InsertBuilder } from "../builders/insert";
import { RelationnalQueryBuilder } from "../builders/relational-builder";
import { SelectBuilder, type SelectedFields } from "../builders/select";
import type { Entity, InferInsertModel } from "../core/table";
import { UpdateBuilder } from "../builders/update";
import { DeleteBuilder } from "../builders/delete";

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

    query<T extends Entity>(table: T) {
        return new RelationnalQueryBuilder<any>(this.docClient, table as any);
    }

    update<T extends Entity>(table: T): UpdateBuilder<T> {
        return new UpdateBuilder(table, this.docClient);
    }

    delete<T extends Entity>(
        table: T,
        keys: Partial<InferInsertModel<T>>,
    ): DeleteBuilder<T> {
        return new DeleteBuilder(table, this.docClient, keys);
    }
}

export function mizzle(client: DynamoDBClient) {
    return new DynamoDB(client);
}
