import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type ColumnBuilderBaseConfig,
  type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type BooleanColumnInitial<TName extends string> = BooleanColumnBuilder<{
  name: TName;
  dataType: "boolean";
  columnType: "BOOL";
  data: boolean;
}>;

export class BooleanColumnBuilder<
  T extends ColumnBuilderBaseConfig<"boolean", "BOOL">,
> extends ColumnBuider<T> {
  constructor(name: T["name"]) {
    super(name, "boolean", "BOOL");
  }

  build<TTableName extends string>(
    table: AnyTable,
  ): BooleanColumn<MakeColumnConfig<T, TTableName>> {
    return new BooleanColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class BooleanColumn<T extends ColumnBaseConfig<"boolean", "BOOL">> extends Column<T> {}

export function boolean(): BooleanColumnInitial<"">;
export function boolean<TName extends string>(name: TName): BooleanColumnInitial<TName>;
/**
 * Defines a Boolean column ("BOOL") in DynamoDB.
 *
 * @example
 * ```ts
 * const users = defineTable("users", {
 *   isActive: boolean("is_active").default(true),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A BooleanColumnBuilder instance.
 */
export function boolean(name?: string) {
  return new BooleanColumnBuilder(name ?? "");
}
