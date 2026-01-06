import type { Column, AnyColumn } from "./column";
import type { PhysicalTable } from "./table";

export type RequiredKeyOnly<
    TKey extends string,
    T extends Column,
    TInferMode extends "select" | "insert" = "select",
> = TInferMode extends "select"
    ? never
    : T extends AnyColumn<{
            hasDefault: false;
            notNull: true;
        }>
      ? TKey
      : never;

export type OpitionalKeyOnly<
    TKey extends string,
    T extends Column,
    TInferMode extends "select" | "insert" = "select",
> = TKey extends RequiredKeyOnly<TKey, T, TInferMode> ? never : TKey;

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
