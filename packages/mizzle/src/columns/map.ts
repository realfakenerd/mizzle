import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type ColumnBuilderBaseConfig,
  type MakeColumnConfig,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type MapColumnInitial<TName extends string> = MapColumnBuilder<{
  name: TName;
  data: Record<string, unknown>;
  dataType: "map";
  columnType: "M";
}>;

export class MapColumnBuilder<
  T extends ColumnBuilderBaseConfig<"map", "M">,
> extends ColumnBuider<T> {
  constructor(name: T["name"]) {
    super(name, "map", "M");
  }

  build<TTableName extends string>(table: AnyTable): MapColumn<MakeColumnConfig<T, TTableName>> {
    return new MapColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class MapColumn<T extends ColumnBaseConfig<"map", "M">> extends Column<T> {}

export function map(): MapColumnInitial<"">;
export function map<TName extends string>(name: TName): MapColumnInitial<TName>;
/**
 * Defines a Map column ("M") in DynamoDB.
 *
 * A map is a set of key-value pairs (like a JSON object).
 * Unlike `json()`, this is stored as a native DynamoDB Map, allowing you to filter/query nested properties
 * more easily in some contexts, though `json()` is often preferred for simple object storage.
 *
 * @example
 * ```ts
 * const users = defineTable("users", {
 *   metadata: map("metadata").$type<{ verified: boolean, loginCount: number }>(),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A MapColumnBuilder instance.
 */
export function map(name?: string) {
  return new MapColumnBuilder(name ?? "");
}
