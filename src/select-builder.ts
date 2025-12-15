import type { Column } from "./column";
import type { SelectedFields as SelectedFieldsBase } from "./operations";
import type { Table } from "./table";
import { getTableColumns } from "./utils";

export type SelectedFields = SelectedFieldsBase<Column, Table>;

// export class SelectBuilder<T extends TableDefinition<any>, TSelection = any> {
//     constructor(
//         private client: DynamoDBDocumentClient,
//         private fields: TSelection
//     ) { }

//     from(table: T) {
//         const qb = new DynamoQueryBuilder<T>(this.client, table);
//         if (this.fields && Object.keys(this.fields).length > 0) {
//             const selectedColumns = Object.keys(this.fields).map((col) => col);
//             qb.setProjection(selectedColumns);
//         }

//         return qb;
//     }
// }

export class SelectBuilder<
    TSelection extends SelectedFields | undefined,
    TBuilder extends "db" | "qb" = "db",
> {
    private fields: TSelection;

    constructor(config: { fields: TSelection }) {
        this.fields = config.fields;
    }

    from<TFrom extends Table>(source: TFrom) {
        const isPartialSelect = !!this.fields;
        const src = source as TFrom;

        let fields: SelectedFields;

        if (this.fields) {
            fields = this.fields;
        } else {
            fields = getTableColumns<Table>(src);
        }

        return;
    }
}

type ColumnsSelection = Record<string, unknown>;
type SelectMode = "patial" | "single" | "mutiple";

export class SelectBase<
    TTableName extends string | undefined,
    TSelection extends ColumnsSelection,
    TSelectMode extends SelectMode,
> {}
