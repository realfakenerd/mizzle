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

export type JsonColumnInitial<TName extends string> = JsonColumnBuilder<{
    name: TName;
    dataType: "json";
    columnType: "S";
    data: unknown;
}>;

export class JsonColumnBuilder<
    T extends ColumnBuilderBaseConfig<"json", "S">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "json", "S");
    }

    /** @internal */
    override build<TTableName extends string>(
        table: AnyTable,
    ): Column<MakeColumnConfig<T, TTableName>> {
        return new JsonColumn<MakeColumnConfig<T, TTableName>>(
            table,
            this.config as ColumnRuntimeConfig<T["data"], object>,
        );
    }
}

export class JsonColumn<
    T extends ColumnBaseConfig<"json", "S">,
> extends Column<T> {
    override getDynamoType(): string {
        return "json";
    }

    override mapToDynamoValue(value: T["data"]): string {
        return JSON.stringify(value);
    }

    override mapFromDynamoValue(value: T["data"] | string): T["data"] {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch {
                return value as T["data"];
            }
        }
        return value;
    }
}

export function json(): JsonColumnInitial<"">;
export function json<TName extends string>(
    name: TName,
): JsonColumnInitial<TName>;
export function json(name?: string) {
    return new JsonColumnBuilder(name ?? "");
}
