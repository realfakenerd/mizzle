import { Table } from "./table";

export type Assume<T, U> = T extends U ? T : U;

export type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};

export type Update<T, TUpdate> = {
    [K in Exclude<keyof T, keyof TUpdate>]: T[K];
} & TUpdate;

export function getTableColumns<T extends Table>(table: T): T["_"]["columns"] {
    return table[Table.Symbol.Columns];
}

export interface ColumnType<
    TData = unknown,
    THasDefault extends boolean = boolean,
> {
    _$data: TData;
    _$hasDefault: THasDefault;
}
