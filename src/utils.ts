import { Entity } from "./table";

export type Assume<T, U> = T extends U ? T : U;

export type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};

export type Update<T, TUpdate> = {
    [K in Exclude<keyof T, keyof TUpdate>]: T[K];
} & TUpdate;

export function getEntityColumns<T extends Entity>(
    table: T,
): T["_"]["columns"] {
    return table[Entity.Symbol.Columns];
}

export interface ColumnType<
    TData = unknown,
    THasDefault extends boolean = boolean,
> {
    _$data: TData;
    _$hasDefault: THasDefault;
}
