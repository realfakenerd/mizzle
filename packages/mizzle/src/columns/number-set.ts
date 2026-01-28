import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type ColumnBuilderBaseConfig,
  type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type NumberSetColumnInitial<TName extends string> = NumberSetColumnBuilder<{
  name: TName;
  data: Set<number>;
  columnType: "NS";
  dataType: "numberSet";
}>;

export class NumberSetColumnBuilder<
  T extends ColumnBuilderBaseConfig<"numberSet", "NS">,
> extends ColumnBuider<T> {
  constructor(name: T["name"]) {
    super(name, "numberSet", "NS");
  }

  build<TTableName extends string>(
    table: AnyTable,
  ): NumberSetColumn<MakeColumnConfig<T, TTableName>> {
    return new NumberSetColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class NumberSetColumn<T extends ColumnBaseConfig<"numberSet", "NS">> extends Column<T> {}

export function numberSet(): NumberSetColumnInitial<"">;
export function numberSet<TName extends string>(name: TName): NumberSetColumnInitial<TName>;
/**
 * Defines a Number Set column ("NS") in DynamoDB.
 *
 * Represents a set of unique numbers. Mizzle handles conversion between JavaScript `Set<number>` (or arrays) and DynamoDB Sets.
 *
 * @example
 * ```ts
 * const metrics = defineTable("metrics", {
 *   counts: numberSet("counts"),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A NumberSetColumnBuilder instance.
 */
export function numberSet(name?: string) {
  return new NumberSetColumnBuilder(name ?? "");
}
