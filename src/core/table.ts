import { Column, type GetColumnData } from "./column";
import type {
    BuildColumns,
    ColumnBuider,
    ColumnBuilderBase,
} from "./column-builder";
import { getColumnBuilders, type ColumnsBuilder } from "../columns/all";
import type { IndexBuilder } from "../indexes";
import type { OpitionalKeyOnly, RequiredKeyOnly } from "./operations";
import type { KeyStrategy } from "./strategies";
import type { Simplify, Update } from "../utils";

type IndexStrategyConfig<TIndex extends IndexBuilder> =
    TIndex["type"] extends "lsi"
        ? { sk: KeyStrategy }
        : {
              pk: KeyStrategy;
              sk?: KeyStrategy;
          };

type IndexesStrategy<
    TIndexes extends Record<string, IndexBuilder> | undefined,
> =
    TIndexes extends Record<string, IndexBuilder>
        ? { [K in keyof TIndexes]?: IndexStrategyConfig<TIndexes[K]> }
        : {};

export type StrategyCallback<
    TColumns extends Record<string, Column>,
    TPhysicalConfig extends PhysicalTableConfig,
> = (columns: TColumns) => {
    [K in keyof TPhysicalConfig as K extends "pk" | "sk"
        ? K
        : never]: KeyStrategy;
} & IndexesStrategy<TPhysicalConfig["indexes"]>;

export interface EntityConfig<TColumn extends Column = Column<any>> {
    name: string;
    table: PhysicalTable;
    columns: Record<string, TColumn>;
}

export interface PhysicalTableConfig {
    pk: ColumnBuilderBase;
    sk?: ColumnBuilderBase;
    indexes?: Record<string, IndexBuilder>;
}

const Columns = Symbol.for("mizzle:Columns");
const Indexes = Symbol.for("mizzle:Indexes");
const SortKey = Symbol.for("mizzle:SortKey");
const TableName = Symbol.for("mizzle:TableName");
const PartitionKey = Symbol.for("mizzle:PartitionKey");

const EntityName = Symbol.for("mizzle:EntityName");
const EntityStrategy = Symbol.for("mizzle:EntityStrategy");
const PhysicalTableSymbol = Symbol.for("mizzle:PhysicalTable");

export class PhysicalTable<
    T extends PhysicalTableConfig = PhysicalTableConfig,
> {
    declare readonly _: {
        config: T;
        name: string;
        pk: Column;
        sk?: Column;
        indexes: T["indexes"];
    };

    /** @internal */
    [TableName]: string;

    /** @internal */
    [Indexes]: T["indexes"];

    /** @internal */
    [PartitionKey]: Column;

    /** @internal */
    [SortKey]?: Column;

    static readonly Symbol = {
        TableName: TableName as typeof TableName,
        Indexes: Indexes as typeof Indexes,
        PartitionKey: PartitionKey as typeof PartitionKey,
        SortKey: SortKey as typeof SortKey,
    };

    constructor(name: string, config: T) {
        this[TableName] = name;
        this[PartitionKey] = (config.pk as ColumnBuider).build({} as any);
        this[SortKey] = config.sk
            ? (config.sk as ColumnBuider).build({} as any)
            : undefined;
        this[Indexes] = config.indexes;
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
    [EntityName]: string;

    /** @internal */
    [PhysicalTableSymbol]: T["table"];

    /** @internal */
    [Columns]: T["columns"];

    [EntityStrategy]: Record<string, KeyStrategy>;

    static readonly Symbol = {
        Columns: Columns as typeof Columns,
        EntityName: EntityName as typeof EntityName,
        EntityStrategy: EntityStrategy as typeof EntityStrategy,
        PhysicalTableSymbol: PhysicalTableSymbol as typeof PhysicalTableSymbol,
    };

    constructor(
        name: T["name"],
        table: T["table"],
        columns: T["columns"],
        strategies: Record<string, KeyStrategy>,
    ) {
        this[EntityName] = name;
        this[PhysicalTableSymbol] = table;
        this[Columns] = columns;
        this[EntityStrategy] = strategies;
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

export type UpdateTableConfig<
    T extends PhysicalTableConfig,
    TUpdate extends Partial<PhysicalTableConfig>,
> = Required<Update<T, TUpdate>>;

export type AnyTable<TPartial extends Partial<PhysicalTableConfig> = {}> =
    PhysicalTable<UpdateTableConfig<PhysicalTableConfig, TPartial>>;

export function dynamoEntity<
    TName extends string,
    TTable extends PhysicalTable,
    TColumnsMap extends Record<string, ColumnBuilderBase>,
>(
    table: TTable,
    name: TName,
    columns: TColumnsMap | ((columnsTypes: ColumnsBuilder) => TColumnsMap),
    strategies?: StrategyCallback<
        BuildColumns<TName, TColumnsMap>,
        TTable["_"]
    >,
): EntityWithColumns<{
    name: TName;
    table: TTable;
    columns: BuildColumns<TName, TColumnsMap>;
}> {
    const parsedColumns: TColumnsMap =
        typeof columns === "function" ? columns(getColumnBuilders()) : columns;

    const tempEntity = {} as Entity;
    const builtColumns = Object.fromEntries(
        Object.entries(parsedColumns).map(([name, colBuilderBase]) => {
            const colBuilder = colBuilderBase as ColumnBuider;
            colBuilder.setName(name);
            const column = colBuilder.build(tempEntity);
            return [name, column];
        }),
    ) as BuildColumns<TName, TColumnsMap>;

    const definedStrategies = strategies ? strategies(builtColumns) : {};

    const rawEntity = new Entity(name, table, {}, definedStrategies);

    rawEntity[Columns] = builtColumns;

    const entity = Object.assign(rawEntity, builtColumns);

    return entity as any;
}

export function dynamoTable<
    TTableName extends string,
    TConfig extends PhysicalTableConfig,
>(name: TTableName, config: TConfig) {
    return new PhysicalTable(name, config);
}
