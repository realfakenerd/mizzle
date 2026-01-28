import { Column, type ColumnBaseConfig } from "../core/column";
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

  build<TTableName extends string>(table: AnyTable): JsonColumn<MakeColumnConfig<T, TTableName>> {
    return new JsonColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class JsonColumn<T extends ColumnBaseConfig<"json", "S">> extends Column<T> {
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
export function json<TName extends string>(name: TName): JsonColumnInitial<TName>;
/**
 * Defines a JSON column.
 *
 * In DynamoDB, this is stored as a string ("S") containing serialized JSON.
 * Mizzle automatically handles JSON.stringify/parse for you.
 *
 * You can type the JSON object using the `.$type<T>()` method.
 *
 * @example
 * ```ts
 * interface Address {
 *   street: string;
 *   city: string;
 * }
 *
 * const users = defineTable("users", {
 *   address: json("address").$type<Address>(),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A JsonColumnBuilder instance.
 */
export function json(name?: string) {
  return new JsonColumnBuilder(name ?? "");
}
