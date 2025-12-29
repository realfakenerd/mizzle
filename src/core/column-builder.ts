import { type Column, ExtraConfigColumn } from "./column";
import type { AnyTable } from "./table";
import type { Assume, Simplify } from "../utils/utils";

export type ColumnDataType =
    | "S"
    | "N"
    | "BOOL"
    | "M"
    | "L"
    | "B"
    | "BS"
    | "NS"
    | "NULL"
    | "SS";

export interface ColumnBuilderBaseConfig<
    TDataType extends string,
    TColumnDataType extends ColumnDataType,
> {
    name: string;
    dataType: TDataType;
    columnType: TColumnDataType;
    data: unknown;
}

export type BuildExtraConfigColumns<
    _TTableName extends string,
    TConfigMap extends Record<string, ColumnBuilderBase>,
> = { [Key in keyof TConfigMap]: ExtraConfigColumn } & {};

export type MakeColumnConfig<
    T extends ColumnBuilderBaseConfig<string, ColumnDataType>,
    TTableName extends string,
    TData = T extends { $type: infer U } ? U : T["data"],
> = {
    name: T["name"];
    tableName: TTableName;
    dataType: T["dataType"];
    columnType: T["columnType"];
    data: TData;
    notNull: T extends { notNull: true } ? true : false;
    hasDefault: T extends { hasDefault: true } ? true : false;
    hasRuntimeDefault: T extends { hasRuntimeDefault: true } ? true : false;
    isPartitionKey: T extends { isPartitionKey: true } ? true : false;
    isSortKey: T extends { isSortKey: true } ? true : false;
} & {};

export type ColumnBuilderRuntimeConfig<
    TData,
    TRuntimeConfig extends object = object,
> = {
    name: string;
    notNull: boolean;
    default: TData;
    dataType: string;
    columnType: string;
    isPartitionKey: boolean;
    isSortKey: boolean;
    hasDefault: boolean;
    partitionKey: boolean;
    sortKey: boolean;
    defaultFn: () => TData | undefined;
    onUpdateFn: () => TData | undefined;
} & TRuntimeConfig;

export type ColumnBuilderTypeConfig<
    T extends ColumnBuilderBaseConfig<string, ColumnDataType>,
    TTypeConfig extends object = object,
> = Simplify<
    {
        name: T["name"];
        dataType: T["dataType"];
        data: T["data"];
        columnType: T["columnType"];
        notNull: T extends { notNull: infer U } ? U : boolean;
        hasDefault: T extends { hasDefault: infer U } ? U : boolean;
        isPartitionKey: T extends { isPartitionKey: infer U } ? U : boolean;
        isSortKey: T extends { isSortKey: infer U } ? U : boolean;
    } & TTypeConfig
>;

export interface ColumnBuilderBase<
    T extends ColumnBuilderBaseConfig<
        string,
        ColumnDataType
    > = ColumnBuilderBaseConfig<string, ColumnDataType>,
    TTypeConfig extends object = object,
> {
    _: ColumnBuilderTypeConfig<T, TTypeConfig>;
}

export interface ColumnBuiderExtraConfig {
    partitionKeyHasDefault?: boolean;
}

export type NotNull<T extends ColumnBuilderBase> = T & {
    _: {
        notNull: true;
    };
};

export type HasDefault<T extends ColumnBuilderBase> = T & {
    _: {
        hasDefault: true;
    };
};

export type HasRuntimeDefault<T extends ColumnBuilderBase> = T & {
    _: {
        hasRuntimeDefault: true;
    };
};

export type IsPartitionKey<T extends ColumnBuilderBase> = T & {
    _: {
        isPartitionKey: true;
        notNull: false;
    };
};

export type IsSortKey<T extends ColumnBuilderBase> = T & {
    _: {
        isSortKey: true;
        notNull: false;
    };
};

export type $Type<T extends ColumnBuilderBase, TType> = T & {
    _: { $type: TType };
};

export type BuildColumn<
    TTableName extends string,
    TBuilder extends ColumnBuilderBase,
> = Column<
    MakeColumnConfig<TBuilder["_"], TTableName>,
    {},
    Simplify<
        Omit<TBuilder["_"], keyof MakeColumnConfig<TBuilder["_"], TTableName>>
    >
>;

export type BuildColumns<
    TTableName extends string,
    TConfigMap extends Record<string, ColumnBuilderBase>,
> = {
    [Key in keyof TConfigMap]: BuildColumn<
        TTableName,
        {
            _: Omit<TConfigMap[Key]["_"], "name"> & {
                name: TConfigMap[Key]["_"]["name"] extends ""
                    ? Assume<Key, string>
                    : TConfigMap[Key]["_"]["name"];
            };
        }
    >;
} & {};

export abstract class ColumnBuider<
    T extends ColumnBuilderBaseConfig<
        string,
        ColumnDataType
    > = ColumnBuilderBaseConfig<string, ColumnDataType>,
    TRuntimeConfig extends object = object,
    TTypeConfig extends object = object,
    TExtraConfig extends ColumnBuiderExtraConfig = ColumnBuiderExtraConfig,
> implements ColumnBuilderBase<T, TTypeConfig>
{
    declare _: ColumnBuilderTypeConfig<T, TTypeConfig>;
    protected config: ColumnBuilderRuntimeConfig<T["data"], TRuntimeConfig>;

    constructor(
        name: T["name"],
        dataType: T["dataType"],
        columnType: T["columnType"],
    ) {
        this.config = {
            name,
            dataType,
            columnType,
            notNull: false,
            default: undefined,
            hasDefault: false,
            isPartitionKey: false,
            isSortKey: false,
        } as ColumnBuilderRuntimeConfig<T["data"], TRuntimeConfig>;
    }

    default(
        value: this["_"] extends { $type: infer U } ? U : this["_"]["data"],
    ): HasDefault<this> {
        this.config.default = value;
        this.config.hasDefault = true;
        return this as HasDefault<this>;
    }

    $defaultFn(
        fn: () => this["_"] extends { $type: infer U } ? U : this["_"]["data"],
    ): HasRuntimeDefault<HasDefault<this>> {
        this.config.defaultFn = fn;
        this.config.hasDefault = true;
        return this as HasRuntimeDefault<HasDefault<this>>;
    }

    $onUpdateFn(
        fn: () => this["_"] extends { $type: infer U } ? U : this["_"]["data"],
    ): HasDefault<this> {
        this.config.onUpdateFn = fn;
        this.config.hasDefault = true;
        return this as HasDefault<this>;
    }

    /**
     * Change de data type of the column.
     *
     * ```ts
     * const users = dynamoTable('users', {
     *  details: map().$type<UserDetails>().nullable()
     * });
     * ```
     */
    $type<TType>(): $Type<this, TType> {
        return this as $Type<this, TType>;
    }

    /** @internal */
    getConfig() {
        return this.config;
    }

    partitionKey(): TExtraConfig["partitionKeyHasDefault"] extends true
        ? IsPartitionKey<HasDefault<NotNull<this>>>
        : IsPartitionKey<NotNull<this>> {
        this.config.isPartitionKey = true;
        this.config.notNull = false;

        return this as TExtraConfig["partitionKeyHasDefault"] extends true
            ? IsPartitionKey<HasDefault<NotNull<this>>>
            : IsPartitionKey<NotNull<this>>;
    }

    sortKey(): IsSortKey<this> {
        this.config.isSortKey = true;
        this.config.notNull = false;
        return this as IsSortKey<this>;
    }

    /**
     * Turns a column nullable.
     *
     * ```ts
     * const users = dynamoTable('users', {
     *  name: string().nullable()
     * });
     * ```
     */
    notNull(): NotNull<this> {
        this.config.notNull = true;
        return this as NotNull<this>;
    }

    /** @internal */
    setName(name: string) {
        if (this.config.name !== "") return;
        this.config.name = name;
    }

    /** @internal */
    abstract build<TTableName extends string>(
        table: AnyTable<{ name: TTableName }>,
    ): Column<MakeColumnConfig<T, TTableName>>;
}
