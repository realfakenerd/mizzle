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

export type BinarySetColumnInitial<TName extends string> =
    BinarySetColumnBuilder<{
        name: TName;
        dataType: "binarySet";
        columnType: "BS";
        data: Set<Uint8Array>;
    }>;

export class BinarySetColumnBuilder<
    T extends ColumnBuilderBaseConfig<"binarySet", "BS">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "binarySet", "BS");
    }

    override build<TTableName extends string>(
        table: AnyTable,
    ): BinarySetColumn<MakeColumnConfig<T, TTableName>> {
        return new BinarySetColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as any,
        );
    }
}

export class BinarySetColumn<
    T extends ColumnBaseConfig<"binarySet", "BS">,
> extends Column<T> {
}

export function binarySet(): BinarySetColumnInitial<"">;
export function binarySet<TName extends string>(
    name: TName,
): BinarySetColumnInitial<TName>;
export function binarySet(name?: string) {
    return new BinarySetColumnBuilder(name ?? "");
}
