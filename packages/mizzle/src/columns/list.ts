import {
    Column,
    type ColumnBaseConfig,
} from "../core/column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type ListColumnInitial<TName extends string> = ListColumnBuilder<{
    name: TName;
    data: unknown[];
    dataType: "array";
    columnType: "L";
}>;

export class ListColumnBuilder<
    T extends ColumnBuilderBaseConfig<"array", "L">,
> extends ColumnBuider<T> {
    constructor(name: T["name"]) {
        super(name, "array", "L");
    }
    build<TTableName extends string>(
        table: AnyTable,
    ): ListColumn<MakeColumnConfig<T, TTableName>> {
        return new ListColumn<MakeColumnConfig<T, TTableName>>(
            table,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.config as any,
        );
    }
}

export class ListColumn<
    T extends ColumnBaseConfig<"array", "L">,
> extends Column<T> {
}

export function list(): ListColumnInitial<"">;
export function list<TName extends string>(
    name: TName,
): ListColumnInitial<TName>;
/**
 * Defines a List column ("L") in DynamoDB.
 * 
 * A list is an ordered collection of values. It can store mixed types, 
 * but you can enforce a specific type using `.$type<T[]>()`.
 * 
 * @example
 * ```ts
 * const posts = defineTable("posts", {
 *   tags: list("tags").$type<string[]>(),
 * });
 * ```
 * 
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A ListColumnBuilder instance.
 */
export function list(name?: string) {
    return new ListColumnBuilder(name ?? "");
}
