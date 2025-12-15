import {
    Column,
    type ColumnBaseConfig,
    type ColumnRuntimeConfig,
} from "../column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type MakeColumnConfig,
} from "../column-builder";
import type { AnyTable } from "../table";

export type MapColumnInitial<TName extends string> = MapColumnBuilder<{
    name: TName;
    data: Map<any, any>;
    dataType: "map";
    columnType: "M";
}>;

export class MapColumnBuilder<
    T extends ColumnBuilderBaseConfig<"map", "M">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "map", "M");
    }

    override build<TTableName extends string>(
        table: AnyTable<{ name: TTableName }>,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new MapColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<any, any>,
        );
    }
}

export class MapColumn<
    T extends ColumnBaseConfig<"map", "M">,
> extends Column<T> {
    override getDynamoType(): string {
        return "map";
    }
}

export function map(): MapColumnInitial<"">;
export function map<TName extends string>(name: TName): MapColumnInitial<TName>;
export function map(name?: string) {
    return new MapColumnBuilder(name ?? "");
}
