import {
    Column,
    type ColumnBaseConfig,
    type ColumnRuntimeConfig,
} from "../core/column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type ListColumnInitial<TName extends string> = ListColumnBuilder<{
    name: TName;
    data: unknown[];
    dataType: "array";
    columnType: "L";
}>;

export class ListColumnBuilder<
    T extends ColumnBuilderBaseConfig<"array", "L">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "array", "L");
    }
    override build<TTableName extends string>(
        table: AnyTable,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new ListColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<any, any>,
        );
    }
}

export class ListColumn<
    T extends ColumnBaseConfig<"array", "L">,
> extends Column<T> {
    override getDynamoType(): string {
        return "array";
    }
}

export function list(): ListColumnInitial<"">;
export function list<TName extends string>(
    name: TName,
): ListColumnInitial<TName>;
export function list(name?: string) {
    return new ListColumnBuilder(name ?? "");
}
