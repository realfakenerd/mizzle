import {
    Column,
    type ColumnBaseConfig,
} from "../core/column";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type HasDefault,
    type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type StringSetColumnInitial<TName extends string> =
    StringSetColumnBuilder<{
        name: TName;
        dataType: "string";
        columnType: "SS";
        data: Set<string>;
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

    build<TTableName extends string>(
        table: AnyTable,
    ): StringSetColumn<MakeColumnConfig<T, TTableName>> {
        return new StringSetColumn<MakeColumnConfig<T, TTableName>>(
            table,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.config as any,
        );
    }
}

export class StringSetColumn<
    T extends ColumnBaseConfig<"string", "SS">,
> extends Column<T> {
}

export function stringSet(): StringSetColumnInitial<"">;
export function stringSet<TName extends string>(
    name: TName,
): StringSetColumnInitial<TName>;
/**
 * Defines a String Set column ("SS") in DynamoDB.
 * 
 * Represents a set of unique strings. Mizzle handles conversion between JavaScript `Set<string>` (or arrays) and DynamoDB Sets.
 * 
 * @example
 * ```ts
 * const users = defineTable("users", {
 *   roles: stringSet("roles"),
 * });
 * ```
 * 
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A StringSetColumnBuilder instance.
 */
export function stringSet(name?: string) {
    return new StringSetColumnBuilder(name ?? "");
}
