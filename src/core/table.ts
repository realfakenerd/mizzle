import { ENTITY_SYMBOLS, INFER_MODE, TABLE_SYMBOLS } from "@mizzle/shared";
import type { Simplify, Update } from "@mizzle/shared";
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

export class PhysicalTable<
    T extends PhysicalTableConfig = PhysicalTableConfig,
> {
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
    [TABLE_SYMBOLS.PARTITION_KEY]: Column = {} as any;

    /** @internal */
    [TABLE_SYMBOLS.SORT_KEY]?: Column = undefined;

    static readonly Symbol = TABLE_SYMBOLS;

    constructor(name: string, config: T) {
        this[TABLE_SYMBOLS.TABLE_NAME] = name;
        this[TABLE_SYMBOLS.PARTITION_KEY] = (config.pk as ColumnBuider).build(
            {} as any,
        );
        this[TABLE_SYMBOLS.SORT_KEY] = config.sk
            ? (config.sk as ColumnBuider).build({} as any)
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
    [ENTITY_SYMBOLS.PHYSICAL_TABLE]: T["table"] = {} as any;

    /** @internal */
    [ENTITY_SYMBOLS.COLUMNS]: T["columns"] = {} as any;

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
        TTable["_"] extends PhysicalTableConfig ? TTable["_"] : any
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
            const column = colBuilder.build(tempEntity as any);
            return [name, column];
        }),
    ) as BuildColumns<TName, TColumnsMap>;

    const definedStrategies = strategies ? strategies(builtColumns) : {};

    const rawEntity = new Entity(name, table, {}, definedStrategies);

    rawEntity[ENTITY_SYMBOLS.COLUMNS] = builtColumns;

    const entity = Object.assign(rawEntity, builtColumns);

    return entity as any;
}

export function dynamoTable<
    TTableName extends string,
    TConfig extends PhysicalTableConfig,
>(name: TTableName, config: TConfig) {
    return new PhysicalTable(name, config);
}
