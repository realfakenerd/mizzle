import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type ColumnBuilderBaseConfig,
  type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type BinaryBuilderInitial<TName extends string> = BinaryColumnBuilder<{
  name: TName;
  dataType: "binary";
  columnType: "B";
  data: Buffer;
}>;

export class BinaryColumnBuilder<
  T extends ColumnBuilderBaseConfig<"binary", "B">,
> extends ColumnBuider<T> {
  constructor(name: T["name"]) {
    super(name, "binary", "B");
  }

  build<TTableName extends string>(table: AnyTable): BinaryColumn<MakeColumnConfig<T, TTableName>> {
    return new BinaryColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class BinaryColumn<T extends ColumnBaseConfig<"binary", "B">> extends Column<T> {}

export function binary(): BinaryBuilderInitial<"">;
export function binary<TName extends string>(name: TName): BinaryBuilderInitial<TName>;
/**
 * Defines a Binary column ("B") in DynamoDB.
 *
 * Used for storing arbitrary binary data, such as images, compressed files, or raw bytes.
 * Mizzle handles `Uint8Array` or `Buffer` (in Node) for this type.
 *
 * @example
 * ```ts
 * const files = defineTable("files", {
 *   content: binary("content"),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A BinaryColumnBuilder instance.
 */
export function binary(name?: string) {
  return new BinaryColumnBuilder(name ?? "");
}
