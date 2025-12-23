import { Column, type ColumnBaseConfig } from "../column";
import {
    ColumnBuider,
    type MakeColumnConfig,
    type ColumnBuilderBaseConfig,
    type ColumnBuilderRuntimeConfig,
} from "../column-builder";
import type { AnyTable } from "../table";

export type NumberColumnInitial<TName extends string> = NumberColumnBuilder<{
    name: TName;
    dataType: "number";
    columnType: "N";
    data: number;
}>;

export class NumberColumnBuilder<
    T extends ColumnBuilderBaseConfig<"number", "N">,
> extends ColumnBuider<T, { validators: { min?: number; max?: number } }> {
    constructor(name: T["name"]) {
        super(name, "number", "N");
        this.config.validators = {};
    }

    min(value: number): this {
        this.config.validators.min = value;
        return this;
    }

    max(value: number): this {
        this.config.validators.max = value;
        return this;
    }

    /** @internal */
    override build<TTableName extends string>(
        table: AnyTable,
    ): NumberColumn<MakeColumnConfig<T, TTableName>> {
        return new NumberColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnBuilderRuntimeConfig<any, any>,
        );
    }
}

export class NumberColumn<
    T extends ColumnBaseConfig<"number", "N">,
> extends Column<T> {
    override getDynamoType(): string {
        return "N";
    }
}

export function number(): NumberColumnInitial<"">;
export function number<TName extends string>(
    name: TName,
): NumberColumnInitial<TName>;
export function number(name?: string) {
    return new NumberColumnBuilder(name ?? "");
}
