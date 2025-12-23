import { Column, type ColumnBaseConfig } from "../column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type ColumnBuilderRuntimeConfig,
    type MakeColumnConfig,
} from "../column-builder";
import type { AnyTable } from "../table";

export type BooleanColumnInitial<TName extends string> = BooleanColumnBuilder<{
    name: TName;
    dataType: "boolean";
    columnType: "BOOL";
    data: boolean;
}>;

export class BooleanColumnBuilder<
    T extends ColumnBuilderBaseConfig<"boolean", "BOOL">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "boolean", "BOOL");
    }

    build<TTableName extends string>(
        table: AnyTable,
    ): BooleanColumn<MakeColumnConfig<T, TTableName>> {
        return new BooleanColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnBuilderRuntimeConfig<any, any>,
        );
    }
}

export class BooleanColumn<
    T extends ColumnBaseConfig<"boolean", "BOOL">,
> extends Column<T> {
    getDynamoType(): string {
        return "BOOL";
    }
}

export function boolean(): BooleanColumnInitial<"">;
export function boolean<TName extends string>(
    name: TName,
): BooleanColumnInitial<TName>;
export function boolean(name?: string) {
    return new BooleanColumnBuilder(name ?? "");
}
