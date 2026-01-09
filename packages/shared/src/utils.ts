import { ENTITY_SYMBOLS, TABLE_SYMBOLS } from "./constants";

export type Assume<T, U> = T extends U ? T : U;

export type Simplify<T> = {
    [K in keyof T]: T[K];
} & {};

export type Update<T, TUpdate> = {
    [K in Exclude<keyof T, keyof TUpdate>]: T[K];
} & TUpdate;

export function getEntityColumns<T extends { [ENTITY_SYMBOLS.COLUMNS]: Record<string, unknown> }>(
    entity: T,
): T[typeof ENTITY_SYMBOLS.COLUMNS] {
    return entity[ENTITY_SYMBOLS.COLUMNS];
}

export function resolveTableName(entity: {
    [ENTITY_SYMBOLS.PHYSICAL_TABLE]: { [TABLE_SYMBOLS.TABLE_NAME]: string };
}): string {
    const physicalTable = entity[ENTITY_SYMBOLS.PHYSICAL_TABLE];
    return physicalTable[TABLE_SYMBOLS.TABLE_NAME];
}

export function mapToLogical(entity: any, item: Record<string, unknown>): Record<string, unknown> {
    const columns = entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, any>;
    const logicalItem: Record<string, unknown> = {};
    for (const [logicalName, col] of Object.entries(columns)) {
        if (item[col.name] !== undefined) {
            logicalItem[logicalName] = item[col.name];
        } else if (item[logicalName] !== undefined) {
            logicalItem[logicalName] = item[logicalName];
        }
    }
    // Preserve physical keys if present and not already mapped
    if (item['pk'] && !Object.values(columns).some(c => (c as any).name === 'pk')) logicalItem['pk'] = item['pk'];
    if (item['sk'] && !Object.values(columns).some(c => (c as any).name === 'sk')) logicalItem['sk'] = item['sk'];
    return logicalItem;
}

export interface ColumnType<
    TData = unknown,
    THasDefault extends boolean = boolean,
> {
    _$data: TData;
    _$hasDefault: THasDefault;
}
