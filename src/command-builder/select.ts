import type { Column } from "../column";
import type { SelectedFields as SelectedFieldsBase } from "../operations";
import type { Entity, PhysicalTable } from "../table";
import { getEntityColumns } from "../utils";

export type SelectedFields = SelectedFieldsBase<Column, PhysicalTable>;

export class SelectBuilder<
    TSelection extends SelectedFields | undefined,
    TBuilder extends "db" | "qb" = "db",
> {
    private fields: TSelection;

    constructor(config: { fields: TSelection }) {
        this.fields = config.fields;
    }

    from<TFrom extends Entity>(source: TFrom) {
        const isPartialSelect = !!this.fields;
        const src = source as TFrom;

        let fields: SelectedFields;

        if (this.fields) {
            fields = this.fields;
        } else {
            fields = getEntityColumns<Entity>(src);
        }

        return;
    }
}

type ColumnsSelection = Record<string, unknown>;
type SelectMode = "patial" | "single" | "mutiple";
