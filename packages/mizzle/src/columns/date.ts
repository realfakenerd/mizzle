import { Column, type ColumnBaseConfig } from "../core/column";
import {
  ColumnBuider,
  type ColumnBuilderBaseConfig,
  type MakeColumnConfig,
  type HasDefault,
  type HasRuntimeDefault,
} from "../core/column-builder";
import type { AnyTable } from "../core/table";

export type DateColumnInitial<TName extends string> = DateColumnBuilder<{
  name: TName;
  dataType: "date";
  columnType: "S";
  data: Date;
}>;

export class DateColumnBuilder<
  T extends ColumnBuilderBaseConfig<"date", "S">,
> extends ColumnBuider<T> {
  constructor(name: T["name"]) {
    super(name, "date", "S");
  }

  defaultNow(): HasRuntimeDefault<HasDefault<this>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.$defaultFn(() => new Date() as any);
  }

  onUpdateNow(): HasDefault<this> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.$onUpdateFn(() => new Date() as any);
  }

  build<TTableName extends string>(table: AnyTable): DateColumn<MakeColumnConfig<T, TTableName>> {
    return new DateColumn<MakeColumnConfig<T, TTableName>>(
      table,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.config as any,
    );
  }
}

export class DateColumn<T extends ColumnBaseConfig<"date", "S">> extends Column<T> {
  override mapToDynamoValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    } else {
      throw new Error(`Invalid date value: ${value}`);
    }

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }

    return date.toISOString();
  }

  override mapFromDynamoValue(value: unknown): unknown {
    if (typeof value === "string") {
      return new Date(value);
    }
    return value;
  }
}

export function date(): DateColumnInitial<"">;
export function date<TName extends string>(name: TName): DateColumnInitial<TName>;
/**
 * Defines a Date column.
 *
 * In DynamoDB, this is stored as an ISO 8601 string ("S"), but Mizzle automatically
 * handles conversion to/from JavaScript Date objects in your application code.
 *
 * @example
 * ```ts
 * const posts = defineTable("posts", {
 *   createdAt: date("created_at").defaultNow(),
 *   updatedAt: date("updated_at").onUpdateNow(),
 * });
 * ```
 *
 * @param name The name of the attribute in DynamoDB. If omitted, it will use the property name in the definition object.
 * @returns A DateColumnBuilder instance.
 */
export function date(name?: string) {
  return new DateColumnBuilder(name ?? "");
}
