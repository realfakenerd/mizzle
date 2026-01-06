import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "./constants";

export type Assume<T, U> = T extends U ? T : U;

export type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};

export type Update<T, TUpdate> = {
    [K in Exclude<keyof T, keyof TUpdate>]: T[K];
} & TUpdate;

export function getEntityColumns<T extends { [ENTITY_SYMBOLS.COLUMNS]: any }>(
    entity: T,
): T[typeof ENTITY_SYMBOLS.COLUMNS] {
    return entity[ENTITY_SYMBOLS.COLUMNS];
}

export function resolveTableName(entity: any): string {
    const physicalTable = entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];
    return physicalTable[TABLE_SYMBOLS.TABLE_NAME];
}

export interface ColumnType<
    TData = unknown,
    THasDefault extends boolean = boolean,
> {
    _$data: TData;
    _$hasDefault: THasDefault;
}
