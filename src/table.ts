import { Column, ExtraConfigColumn, type GetColumnData } from "./column";
import type {
    BuildColumns,
    BuildExtraConfigColumns,
    ColumnBuider,
    ColumnBuilderBase,
} from "./column-builder";
import { getColumnBuilders, type ColumnsBuilder } from "./columns/all";
import type { GsiBuilder, LsiBuilder } from "./indexes";
import type { OpitionalKeyOnly, RequiredKeyOnly } from "./operations";
import type { Simplify, Update } from "./utils";

export type TableExtraConfigValue = GsiBuilder | LsiBuilder;
export type TableExtraConfig = Record<string, TableExtraConfigValue>;

export interface EntityConfig<TColumn extends Column = Column<any>> {
    name: string;
    table: Table;
    columns: Record<string, TColumn>;
}

/** @internal */
export const TableName = Symbol.for("mizzle:Name");
/** @internal */
export const OriginalName = Symbol.for("mizzle:OriginalName");
/** @internal */
export const BaseName = Symbol.for("mizzle:BaseName");
/** @internal */
export const SortKeys = Symbol.for("mizzle:SortKeys");
/** @internal */
export const ExtraConfigColumns = Symbol.for("mizzle:ExtraConfigColumn");
/** @internal */
export const Columns = Symbol.for("mizzle:Columns");

export class Table {
    /** @internal */
    [TableName]: string;

    /** @internal */
    [Columns]!: Record<string, Column>;

    /** @internal */
    [ExtraConfigColumns]!: Record<string, ExtraConfigColumn>;

    constructor(name: string) {
        this[TableName] = name;
    }
}

export const EntityName = Symbol.for("mizzle:EntityName");
export const EntityStrategy = Symbol.for("mizzle:EntityStrategy");

export class Entity<T extends EntityConfig = EntityConfig> {
    declare readonly _: {
        readonly config: T;
        readonly name: T["name"];
        readonly table: T["table"];
        readonly columns: T["columns"];
        readonly inferSelect: InferSelectModel<Entity<T>>;
        readonly inferInsert: InferInsertModel<Entity<T>>;
    };

    declare readonly $inferSelect: InferSelectModel<Entity<T>>;
    declare readonly $inferInsert: InferInsertModel<Entity<T>>;

    /** @internal */
    [EntityName]: string;

    /** @internal */
    readonly table: T["table"];

    /** @internal */
    [Columns]: T["columns"];

    /** @internal */
    [EntityStrategy]: ((entity: Entity, table: Table) => any[])[];

    constructor(
        name: T["name"],
        table: T["table"],
        columns: T["columns"],
        strategy: any[],
    ) {
        this[EntityName] = name;
        this.table = table;
        this[Columns] = columns;
        this[EntityStrategy] = strategy;
    }
}

export type MapColumnName<
    TName extends string,
    TColumn extends Column,
    TDBColumnNames extends boolean,
> = TDBColumnNames extends true ? TColumn["_"]["name"] : TName;

export type InferModelFromColumns<
    TColumns extends Record<string, Column>,
    TInferMode extends "select" | "insert" = "select",
    TConfig extends { dbColumnNames: boolean; override?: boolean } = {
        dbColumnNames: false;
        override: false;
    },
> = Simplify<
    TInferMode extends "insert"
        ? {
              [Key in keyof TColumns & string as RequiredKeyOnly<
                  MapColumnName<Key, TColumns[Key], TConfig["dbColumnNames"]>,
                  TColumns[Key]
              >]: GetColumnData<TColumns[Key], "query">;
          } & {
              [Key in keyof TColumns & string as OpitionalKeyOnly<
                  MapColumnName<Key, TColumns[Key], TConfig["dbColumnNames"]>,
                  TColumns[Key]
              >]?: GetColumnData<TColumns[Key], "query"> | undefined;
          }
        : {
              [Key in keyof TColumns & string as MapColumnName<
                  Key,
                  TColumns[Key],
                  TConfig["dbColumnNames"]
              >]: GetColumnData<TColumns[Key], "query">;
          }
>;

export type InferSelectModel<
    TTable extends Entity,
    TConfig extends { dbColumnNames: boolean } = { dbColumnNames: false },
> = InferModelFromColumns<TTable["_"]["columns"], "select", TConfig>;

export type InferInsertModel<
    TTable extends Entity,
    TConfig extends { dbColumnNames: boolean; override?: boolean } = {
        dbColumnNames: false;
        override: false;
    },
> = InferModelFromColumns<TTable["_"]["columns"], "insert", TConfig>;

export type EntityWithColumns<T extends EntityConfig> = Entity<T> & {
    [Key in keyof T["columns"]]: T["columns"][Key];
};

export interface DynTableFn<TSchema extends string | undefined = undefined> {
    <
        TTableName extends string,
        TColumnsMap extends Record<string, ColumnBuilderBase>,
    >(
        name: TTableName,
        columns: TColumnsMap,
        extraConfig?: (
            self: BuildExtraConfigColumns<TTableName, TColumnsMap>,
        ) => TableExtraConfigValue[],
    ): EntityWithColumns<{
        name: TTableName;
        schema: TSchema;
        columns: BuildColumns<TTableName, TColumnsMap>;
        table: Table;
    }>;
    <
        TTableName extends string,
        TColumnsMap extends Record<string, ColumnBuilderBase>,
    >(
        name: TTableName,
        columns: (columnTypes: ColumnsBuilder) => TColumnsMap,
        extraConfig?: (
            self: BuildExtraConfigColumns<TTableName, TColumnsMap>,
        ) => TableExtraConfigValue[],
    ): EntityWithColumns<{
        name: TTableName;
        schema: TSchema;
        columns: BuildColumns<TTableName, TColumnsMap>;
        table: Table;
    }>;
}

export type UpdateTableConfig<
    T extends EntityConfig,
    TUpdate extends Partial<EntityConfig>,
> = Required<Update<T, TUpdate>>;

export type AnyTable<TPartial extends Partial<EntityConfig> = {}> = Entity<
    UpdateTableConfig<EntityConfig, TPartial>
>;

/** @internal */
export function tableWithSchema<
    TTableName extends string,
    TSchemaName extends string | undefined,
    TColumnsMap extends Record<string, ColumnBuilderBase>,
>(
    name: TTableName,
    columns: TColumnsMap | ((columnTypes: ColumnsBuilder) => TColumnsMap),
    extraConfig:
        | ((
              self: BuildExtraConfigColumns<TTableName, TColumnsMap>,
          ) => TableExtraConfigValue[] | TableExtraConfig)
        | undefined,
    schema: TSchemaName,
    baseName = name,
): EntityWithColumns<{
    name: TTableName;
    schema: TSchemaName;
    columns: BuildColumns<TTableName, TColumnsMap>;
    table: Table;
}> {
    const rawTable = new Table(name);

    const parsedColumns: TColumnsMap =
        typeof columns === "function" ? columns(getColumnBuilders()) : columns;

    const builtColumns = Object.fromEntries(
        Object.entries(parsedColumns).map(([name, colBuilderBase]) => {
            const colBuilder = colBuilderBase as ColumnBuider;
            colBuilder.setName(name);
            const column = colBuilder.build(rawTable);
            rawTable[SortKeys].push(...colBuilder.buildSortKey(column));
            return [name, column];
        }),
    ) as unknown as BuildColumns<TTableName, TColumnsMap>;

    const builtColumnsForExtraConfig = Object.fromEntries(
        Object.entries(parsedColumns).map(([name, colBuiderBase]) => {
            const colBuilder = colBuiderBase as ColumnBuider;
            colBuilder.setName(name);
            const column = colBuilder.buildExtraConfigColumn(rawTable);
            return [name, column];
        }),
    ) as unknown as BuildExtraConfigColumns<TTableName, TColumnsMap>;

    const table = Object.assign(rawTable, builtColumns);

    table[Table.Symbol.Columns] = builtColumns;
    table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;

    if (extraConfig) {
        table[Table.Symbol.ExtraConfigColumns] = extraConfig as any;
    }

    return table;
}

export const dynamoTable: DynTableFn = (name, columns, extraConfig) => {
    return tableWithSchema(name, columns, extraConfig, undefined);
};
