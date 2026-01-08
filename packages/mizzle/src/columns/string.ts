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

export type StringColumnInitial<TName extends string> = StringColumnBuilder<{
    name: TName;
    dataType: "string";
    columnType: "S";
    data: string;
}>;

class StringColumnBuilder<
    T extends ColumnBuilderBaseConfig<"string", "S">,
> extends ColumnBuider<
    T,
    { validators?: { length?: number; email?: boolean } }
> {
    constructor(name: string) {
        super(name, "string", "S");
    }

    length(value: number): this {
        this.config.validators ??= {};
        this.config.validators.length = value;
        return this;
    }

    email(): this {
        this.config.validators ??= {};
        this.config.validators.email = true;
        return this;
    }

    /** @internal */
    build<TTableName extends string>(
        table: AnyTable,
    ): StringColumn<MakeColumnConfig<T, TTableName>> {
        return new StringColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<T["data"], object>,
        );
    }
}

export class StringColumn<
    T extends ColumnBaseConfig<"string", "S">,
> extends Column<T> {
    override getDynamoType(): string {
        return "S";
    }
}

export function string(): StringColumnInitial<"">;
export function string<TName extends string>(
    name: TName,
): StringColumnInitial<TName>;
export function string(name?: string) {
    return new StringColumnBuilder(name ?? "");
}
