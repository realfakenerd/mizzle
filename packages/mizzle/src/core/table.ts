import { ENTITY_SYMBOLS, INFER_MODE, TABLE_SYMBOLS } from "@mizzle/shared";
import type { Simplify, Update } from "@mizzle/shared";
import { Column, type GetColumnData } from "./column";
import type { BuildColumns, ColumnBuider, ColumnBuilderBase } from "./column-builder";
import { getColumnBuilders, type ColumnsBuilder } from "../columns";
import type { IndexBuilder } from "../indexes";
import type { OpitionalKeyOnly, RequiredKeyOnly } from "./operations";
import type { KeyStrategy } from "./strategies";

type IndexStrategyConfig<TIndex extends IndexBuilder> = TIndex["type"] extends "lsi"
  ? { sk: KeyStrategy | Column }
  : {
      pk: KeyStrategy | Column;
      sk?: KeyStrategy | Column;
    };

type IndexesStrategy<TIndexes extends Record<string, IndexBuilder> | undefined> =
  TIndexes extends Record<string, IndexBuilder>
    ? { [K in keyof TIndexes]?: IndexStrategyConfig<TIndexes[K]> }
    : object;

export type StrategyCallback<
  TColumns extends Record<string, Column>,
  TPhysicalConfig extends PhysicalTableConfig,
> = (columns: TColumns) => {
  [K in keyof TPhysicalConfig as K extends "pk" | "sk" ? K : never]: KeyStrategy | Column;
} & IndexesStrategy<TPhysicalConfig["indexes"]>;

export interface EntityConfig<TColumn extends Column = Column> {
  name: string;
  table: PhysicalTable;
  columns: Record<string, TColumn>;
}

export interface PhysicalTableConfig {
  pk: ColumnBuilderBase;
  sk?: ColumnBuilderBase;
  indexes?: Record<string, IndexBuilder>;
}

export class PhysicalTable<T extends PhysicalTableConfig = PhysicalTableConfig> {
  declare readonly _: {
    config: T;
    name: string;
    partitionKey: Column;
    sortKey?: Column;
    indexes: T["indexes"];
  };

  /** @internal */
  [TABLE_SYMBOLS.TABLE_NAME]: string = "";

  /** @internal */
  [TABLE_SYMBOLS.INDEXES]: T["indexes"] = undefined;

  /** @internal */
  [TABLE_SYMBOLS.PARTITION_KEY]: Column = {} as Column;

  /** @internal */
  [TABLE_SYMBOLS.SORT_KEY]?: Column = undefined;

  static readonly Symbol = TABLE_SYMBOLS;

  constructor(name: string, config: T) {
    this[TABLE_SYMBOLS.TABLE_NAME] = name;
    this[TABLE_SYMBOLS.PARTITION_KEY] = (config.pk as ColumnBuider).build(
      this as unknown as AnyTable,
    );
    this[TABLE_SYMBOLS.SORT_KEY] = config.sk
      ? (config.sk as ColumnBuider).build(this as unknown as AnyTable)
      : undefined;
    this[TABLE_SYMBOLS.INDEXES] = config.indexes;
  }
}

export class Entity<T extends EntityConfig = EntityConfig> {
  declare readonly _: {
    readonly config: T;
    readonly name: T["name"];
    readonly table: T["table"];
    readonly columns: T["columns"];
    readonly strategies: Record<string, KeyStrategy>;
    readonly inferSelect: InferSelectModel<Entity<T>>;
    readonly inferInsert: InferInsertModel<Entity<T>>;
  };

  declare readonly $inferSelect: InferSelectModel<Entity<T>>;
  declare readonly $inferInsert: InferInsertModel<Entity<T>>;

  /** @internal */
  [ENTITY_SYMBOLS.ENTITY_NAME]: string = "";

  /** @internal */
  [ENTITY_SYMBOLS.PHYSICAL_TABLE]: T["table"] = {} as T["table"];

  /** @internal */
  [ENTITY_SYMBOLS.COLUMNS]: T["columns"] = {} as T["columns"];

  [ENTITY_SYMBOLS.ENTITY_STRATEGY]: Record<string, KeyStrategy> = {};

  static readonly Symbol = ENTITY_SYMBOLS;

  constructor(
    name: T["name"],
    table: T["table"],
    columns: T["columns"],
    strategies: Record<string, KeyStrategy>,
  ) {
    this[ENTITY_SYMBOLS.ENTITY_NAME] = name;
    this[ENTITY_SYMBOLS.PHYSICAL_TABLE] = table;
    this[ENTITY_SYMBOLS.COLUMNS] = columns;
    this[ENTITY_SYMBOLS.ENTITY_STRATEGY] = strategies;
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
  {
    [Key in keyof TColumns & string as RequiredKeyOnly<
      MapColumnName<Key, TColumns[Key], TConfig["dbColumnNames"]>,
      TColumns[Key],
      TInferMode
    >]: GetColumnData<TColumns[Key], typeof INFER_MODE.QUERY>;
  } & {
    [Key in keyof TColumns & string as OpitionalKeyOnly<
      MapColumnName<Key, TColumns[Key], TConfig["dbColumnNames"]>,
      TColumns[Key],
      TInferMode
    >]?: GetColumnData<TColumns[Key], typeof INFER_MODE.QUERY> | undefined;
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

export type InferSelectedModel<
  TTable extends Entity,
  TConfig extends { dbColumnNames: boolean } = { dbColumnNames: false },
> = InferSelectModel<TTable, TConfig>;

export type TableDefinition<T extends EntityConfig = EntityConfig> = Entity<T> & {
  columns: T["columns"];
};

export type AtomicValues<T extends Entity> = Partial<InferInsertModel<T>>;

export type EntityWithColumns<T extends EntityConfig> = Entity<T> & {
  [Key in keyof T["columns"]]: T["columns"][Key];
};

export type UpdateTableConfig<
  T extends PhysicalTableConfig,
  TUpdate extends Partial<PhysicalTableConfig>,
> = Required<Update<T, TUpdate>>;

export type AnyTable<TPartial extends Partial<PhysicalTableConfig> = object> = PhysicalTable<
  UpdateTableConfig<PhysicalTableConfig, TPartial>
>;

/**
 * Defines a logical entity that maps to items within a DynamoDB table.
 *
 * @example
 * ```ts
 * const users = dynamoEntity(table, "users", {
 *   id: string("id"),
 *   name: string("name"),
 *   email: string("email"),
 * });
 * ```
 *
 * @param table The physical table definition this entity belongs to.
 * @param name The unique name of the entity (used for typing and potentially in single-table design discriminators).
 * @param columns A map of column definitions or a callback to define columns.
 * @param strategies Optional configuration for key generation strategies (PK/SK construction).
 * @returns The entity definition with strict typing.
 */
export function dynamoEntity<
  TName extends string,
  TTable extends PhysicalTable,
  TColumnsMap extends Record<string, ColumnBuilderBase>,
>(
  table: TTable,
  name: TName,
  columns: TColumnsMap | ((columnsTypes: ColumnsBuilder) => TColumnsMap),
  strategies?: StrategyCallback<BuildColumns<TName, TColumnsMap>, TTable["_"]["config"]>,
): EntityWithColumns<{
  name: TName;
  table: TTable;
  columns: BuildColumns<TName, TColumnsMap>;
}> {
  const parsedColumns: TColumnsMap =
    typeof columns === "function" ? columns(getColumnBuilders()) : columns;

  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name, colBuilderBase]) => {
      const colBuilder = colBuilderBase as ColumnBuider;
      colBuilder.setName(name);
      const column = colBuilder.build({} as unknown as AnyTable);
      return [name, column];
    }),
  ) as BuildColumns<TName, TColumnsMap>;

  const definedStrategies = strategies ? strategies(builtColumns) : {};

  const normalizedStrategies: Record<string, any> = {};
  for (const [key, val] of Object.entries(definedStrategies)) {
    if (val instanceof Column) {
      normalizedStrategies[key] = { type: "prefix", segments: ["", val] };
    } else if (val && typeof val === "object" && !("type" in val && "segments" in val)) {
      // It's an index strategy object { pk, sk }
      const indexStrategy: Record<string, unknown> = { ...(val as object) };
      if (indexStrategy.pk instanceof Column) {
        indexStrategy.pk = { type: "prefix", segments: ["", indexStrategy.pk] };
      }
      if (indexStrategy.sk instanceof Column) {
        indexStrategy.sk = { type: "prefix", segments: ["", indexStrategy.sk] };
      }
      normalizedStrategies[key] = indexStrategy;
    } else {
      normalizedStrategies[key] = val;
    }
  }

  const rawEntity = new Entity(name, table, {}, normalizedStrategies);

  rawEntity[ENTITY_SYMBOLS.COLUMNS] = builtColumns;

  const entity = Object.assign(rawEntity, builtColumns);

  return entity as unknown as EntityWithColumns<{
    name: TName;
    table: TTable;
    columns: BuildColumns<TName, TColumnsMap>;
  }>;
}

/**
 * Defines a physical DynamoDB table schema.
 *
 * @example
 * ```ts
 * const table = dynamoTable("my-app-table", {
 *   pk: string("pk"),
 *   sk: string("sk"),
 * });
 * ```
 *
 * @param name The actual name of the table in DynamoDB (or a reference name).
 * @param config The table configuration, including primary key (pk) and sort key (sk) definitions.
 * @returns A PhysicalTable instance representing the table schema.
 */
export function dynamoTable<TTableName extends string, TConfig extends PhysicalTableConfig>(
  name: TTableName,
  config: TConfig,
) {
  return new PhysicalTable(name, config);
}
