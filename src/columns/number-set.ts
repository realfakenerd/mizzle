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

export type NumberSetColumnInitial<TName extends string> =
    NumberSetColumnBuilder<{
        name: TName;
        data: Set<number>;
        columnType: "NS";
        dataType: "numberSet";
    }>;

export class NumberSetColumnBuilder<
    T extends ColumnBuilderBaseConfig<"numberSet", "NS">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "numberSet", "NS");
    }

    override build<TTableName extends string>(
        table: AnyTable,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new NumberSetColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<any, any>,
        );
    }
}

export class NumberSetColumn<
    T extends ColumnBaseConfig<"numberSet", "NS">,
> extends Column<T> {
    override getDynamoType(): string {
        return "numberSet";
    }
}

export function numberSet(): NumberSetColumnInitial<"">;
export function numberSet<TName extends string>(
    name: TName,
): NumberSetColumnInitial<TName>;
export function numberSet(name?: string) {
    return new NumberSetColumnBuilder(name ?? "");
}
