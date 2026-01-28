import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type MakeColumnConfig,
  type ColumnBuilderBaseConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type NumberColumnInitial<TName extends string> = NumberColumnBuilder<{
  name: TName;
  dataType: "number";
  columnType: "N";
  data: number;
}>;

export class NumberColumnBuilder<
  T extends ColumnBuilderBaseConfig<"number", "N">,
> extends ColumnBuider<T, { validators?: { min?: number; max?: number } }> {
  constructor(name: T["name"]) {
    super(name, "number", "N");
  }

  min(value: number): this {
    this.config.validators ??= {};
    this.config.validators.min = value;
    return this;
  }

  max(value: number): this {
    this.config.validators ??= {};
    this.config.validators.max = value;
    return this;
  }

  build<TTableName extends string>(table: AnyTable): NumberColumn<MakeColumnConfig<T, TTableName>> {
    return new NumberColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class NumberColumn<T extends ColumnBaseConfig<"number", "N">> extends Column<T> {}

export function number(): NumberColumnInitial<"">;
export function number<TName extends string>(name: TName): NumberColumnInitial<TName>;
/**
 * Defines a Number column ("N") in DynamoDB.
 *
 * @example
 * ```ts
 * const products = defineTable("products", {
 *   price: number("price"),
 *   quantity: number("quantity").default(0),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A NumberColumnBuilder instance.
 */
export function number(name?: string) {
  return new NumberColumnBuilder(name ?? "");
}
