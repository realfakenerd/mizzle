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

export type BinaryBuilderInitial<TName extends string> = BinaryColumnBuilder<{
    name: TName;
    dataType: "binary";
    columnType: "B";
    data: Buffer;
}>;

export class BinaryColumnBuilder<
    T extends ColumnBuilderBaseConfig<"binary", "B">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "binary", "B");
    }

    override build<TTableName extends string>(
        table: AnyTable<{ name: TTableName }>,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new BinaryColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<any, any>,
        );
    }
}

export class BinaryColumn<
    T extends ColumnBaseConfig<"binary", "B">,
> extends Column<T> {
    override getDynamoType(): string {
        return "binary";
    }
}

export function binary(): BinaryBuilderInitial<"">;
export function binary<TName extends string>(
    name: TName,
): BinaryBuilderInitial<TName>;
export function binary(name?: string) {
    return new BinaryColumnBuilder(name ?? "");
}
