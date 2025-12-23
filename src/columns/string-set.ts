import {
    Column,
    type ColumnBaseConfig,
    type ColumnRuntimeConfig,
} from "../column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type HasDefault,
    type MakeColumnConfig,
} from "../column-builder";
import type { AnyTable } from "../table";

export type StringSetColumnInitial<TName extends string> =
    StringSetColumnBuilder<{
        name: TName;
        dataType: "string";
        columnType: "SS";
        data: string;
    }>;

export class StringSetColumnBuilder<
    T extends ColumnBuilderBaseConfig<"string", "SS">,
> extends ColumnBuider<T> {
    constructor(name: string) {
        super(name, "string", "SS");
    }

    override default(
        value: this["_"] extends { $type: infer U } ? U : this["_"]["data"],
    ): HasDefault<this> {
        const setVal = value instanceof Set ? value : new Set(value as []);
        this.config.default = setVal;
        this.config.hasDefault = true;
        return this as HasDefault<this>;
    }

    override build<TTableName extends string>(
        table: AnyTable,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new StringSetColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<any, any>,
        );
    }
}

export class StringSetColumn<
    T extends ColumnBaseConfig<"string", "SS">,
> extends Column<T> {
    override getDynamoType(): string {
        return "SS";
    }
}

export function stringSet(): StringSetColumnInitial<"">;
export function stringSet<TName extends string>(
    name: TName,
): StringSetColumnInitial<TName>;
export function stringSet(name?: string) {
    return new StringSetColumnBuilder(name ?? "");
}
