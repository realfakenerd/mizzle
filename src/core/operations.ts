import type { Column, AnyColumn } from "./column";
import type { PhysicalTable } from "./table";

export type RequiredKeyOnly<TKey extends string, T extends Column> =
    T extends AnyColumn<{
        hasDefault: false;
        isNull: false;
    }>
        ? TKey
        : never;

export type OpitionalKeyOnly<TKey extends string, T extends Column> =
    TKey extends RequiredKeyOnly<TKey, T> ? never : TKey;

export type SelectedFieldsFlat<TColumn extends Column> = Record<
    string,
    TColumn
>;

export type SelectedFields<
    TColumn extends Column,
    TTable extends PhysicalTable,
> = Record<
    string,
    SelectedFieldsFlat<TColumn>[string] | TTable | SelectedFieldsFlat<TColumn>
>;
