import { INFER_MODE, NULLS, ORDER } from "@mizzle/shared";
import type { Update } from "@mizzle/shared";
import type {
    ColumnBuilderBaseConfig,
    ColumnBuilderRuntimeConfig,
    ColumnDataType,
} from "./column-builder";
import type { PhysicalTable } from "./table";

export type AnyColumn<
    TPartial extends Partial<ColumnBaseConfig<string, ColumnDataType>> = Record<string, never>,
> = Column<
    Required<Update<ColumnBaseConfig<string, ColumnDataType>, TPartial>>
>;

export interface ColumnBaseConfig<
    TDataType extends string,
    TColumnType extends ColumnDataType,
> extends ColumnBuilderBaseConfig<TDataType, TColumnType> {
    tableName: string;
    name: string;
    notNull: boolean;
    hasDefault: boolean;
    hasRuntimeDefault: boolean;
    isPartitionKey: boolean;
    isSortKey: boolean;
    validators?: Record<string, any>;
}

export type ColumnTypeConfig<
    T extends ColumnBaseConfig<string, ColumnDataType>,
    TTypeConfig extends object,
> = T & {
    tableName: T["tableName"];
    name: T["name"];
    dataType: T["dataType"];
    columnType: T["columnType"];
    data: T["data"];
    notNull: T["notNull"];
    hasDefault: T["hasDefault"];
    hasRuntimeDefault: T["hasRuntimeDefault"];
    isPartitionKey: T["isPartitionKey"];
    isSortKey: T["isSortKey"];
} & TTypeConfig;

export type ColumnRuntimeConfig<
    TData,
    TRuntimeConfig extends object,
> = ColumnBuilderRuntimeConfig<TData, TRuntimeConfig>;

export abstract class Column<
    T extends ColumnBaseConfig<string, ColumnDataType> = ColumnBaseConfig<
        string,
        ColumnDataType
    >,
    TRuntimeConfig extends object = object,
    TTypeConfig extends object = object,
> {
    declare readonly _: ColumnTypeConfig<T, TTypeConfig>;

    readonly name: string;
    readonly primary: boolean;
    readonly notNull: boolean;
    readonly default: T["data"] | undefined;
    readonly defaultFn: () => T["data"] | undefined;
    readonly hasDefault: boolean;
    readonly dataType: T["dataType"];
    readonly columnType: T["columnType"];

    protected config: ColumnRuntimeConfig<T["data"], TRuntimeConfig>;

    constructor(
        readonly table: PhysicalTable,
        config: ColumnRuntimeConfig<T["data"], TRuntimeConfig>,
    ) {
        this.config = config;
        this.name = config.name;
        this.primary = config.partitionKey;
        this.notNull = config.notNull;
        this.default = config.default;
        this.defaultFn = config.defaultFn;
        this.hasDefault = config.hasDefault;
        this.dataType = config.dataType;
        this.columnType = config.columnType as T["columnType"];
    }

    abstract getDynamoType(): string;

    mapFromDynamoValue(value: unknown): unknown {
        return value;
    }

    mapToDynamoValue(value: unknown): unknown {
        return value;
    }
}

export type GetColumnData<
    TColumn extends Column,
    TInferMode extends "query" | "raw" = "query",
> = TInferMode extends typeof INFER_MODE.RAW
    ? TColumn["_"]["data"]
    : TColumn["_"]["notNull"] extends false
      ? TColumn["_"]["data"]
      : TColumn["_"]["data"] | null;

export type InferColumndsDataTypes<TColumns extends Record<string, Column>> = {
    [Key in keyof TColumns]: GetColumnData<TColumns[Key]>;
};

export type IndexedExtraConfigType = {
    order?: typeof ORDER.ASC | typeof ORDER.DESC;
    nulls?: typeof NULLS.FIRST | typeof NULLS.LAST;
    opClass?: string;
};

export class ExtraConfigColumn<
    T extends ColumnBaseConfig<string, ColumnDataType> = ColumnBaseConfig<
        string,
        ColumnDataType
    >,
> extends Column<T, IndexedExtraConfigType> {
    override getDynamoType(): string {
        return this.getDynamoType();
    }

    indexConfig: IndexedExtraConfigType = {
        order: this.config.order ?? ORDER.ASC,
        nulls: this.config.nulls ?? NULLS.LAST,
        opClass: this.config.opClass,
    };

    defaultConfig: IndexedExtraConfigType = {
        order: ORDER.ASC,
        nulls: NULLS.LAST,
        opClass: undefined,
    };

    asc(): Omit<this, "asc" | "desc"> {
        this.indexConfig.order = ORDER.ASC;
        return this;
    }

    desc(): Omit<this, "asc" | "desc"> {
        this.indexConfig.order = ORDER.DESC;
        return this;
    }

    nullsFirst(): Omit<this, "nullsFirst" | "nullsLast"> {
        this.indexConfig.nulls = NULLS.FIRST;
        return this;
    }

    nullsLast(): Omit<this, "nullsFirst" | "nullsLast"> {
        this.indexConfig.nulls = NULLS.LAST;
        return this;
    }

    op(opClass: string): Omit<this, "opClass"> {
        this.indexConfig.opClass = opClass;
        return this;
    }
}
