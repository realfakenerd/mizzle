import { Column, type ColumnBaseConfig } from "../core/column";
import { v7 as uuidV7 } from "uuid";
import {
    ColumnBuider,
    type ColumnBuilderBaseConfig,
    type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

const uuidDefault = () => uuidV7();

export type UUIDColumnInitial<TName extends string> = UUIDColumnBuilder<{
    name: TName;
    dataType: "string";
    columnType: "S";
    data: string;
}>;

export class UUIDColumnBuilder<
    T extends ColumnBuilderBaseConfig<"string", "S">,
> extends ColumnBuider<T> {
    constructor(name: string) {
        super(name, "string", "S");

        this.config.defaultFn = uuidDefault;
    }

    /** @internal */
    build<TTableName extends string>(
        table: AnyTable,
    ): UUIDColumn<MakeColumnConfig<T, TTableName>> {
        return new UUIDColumn<MakeColumnConfig<T, TTableName>>(
            table,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.config as any,
        );
    }
}

export class UUIDColumn<
    T extends ColumnBaseConfig<"string", "S">,
> extends Column<T> {
}

export function uuid(): UUIDColumnInitial<"">;
export function uuid<TName extends string>(
    name: TName,
): UUIDColumnInitial<TName>;
/**
 * Defines a UUID column.
 * 
 * In DynamoDB, this is stored as a string ("S"). It includes a `.defaultRandom()` helper
 * to automatically generate UUID v7 values on insert.
 * 
 * @example
 * ```ts
 * const users = defineTable("users", {
 *   id: uuid("id").partitionKey().defaultRandom(),
 * });
 * ```
 * 
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A UUIDColumnBuilder instance.
 */
export function uuid(name?: string) {
    return new UUIDColumnBuilder(name ?? "");
}
