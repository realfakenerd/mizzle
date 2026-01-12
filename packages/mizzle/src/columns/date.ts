import {
    Column,
    type ColumnBaseConfig,
    type ColumnRuntimeConfig,
} from "../core/column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type MakeColumnConfig,
    type HasDefault,
    type HasRuntimeDefault,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type DateColumnInitial<TName extends string> = DateColumnBuilder<{
    name: TName;
    dataType: "date";
    columnType: "S";
    data: Date;
}>;

export class DateColumnBuilder<
    T extends ColumnBuilderBaseConfig<"date", "S">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "date", "S");
    }

    defaultNow(): HasRuntimeDefault<HasDefault<this>> {
        return this.$defaultFn(() => new Date() as any);
    }

    onUpdateNow(): HasDefault<this> {
        return this.$onUpdateFn(() => new Date() as any);
    }

    build<TTableName extends string>(
        table: AnyTable,
    ): DateColumn<MakeColumnConfig<T, TTableName>> {
        return new DateColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as any,
        );
    }
}

export class DateColumn<
    T extends ColumnBaseConfig<"date", "S">,
> extends Column<T> {
    override mapToDynamoValue(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        let date: Date;
        if (value instanceof Date) {
            date = value;
        } else if (typeof value === "string" || typeof value === "number") {
            date = new Date(value);
        } else {
            throw new Error(`Invalid date value: ${value}`);
        }

        if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid date value: ${value}`);
        }

        return date.toISOString();
    }

    override mapFromDynamoValue(value: unknown): unknown {
        if (typeof value === "string") {
            return new Date(value);
        }
        return value;
    }
}

export function date(): DateColumnInitial<"">;
export function date<TName extends string>(name: TName): DateColumnInitial<TName>;
export function date(name?: string) {
    return new DateColumnBuilder(name ?? "");
}
