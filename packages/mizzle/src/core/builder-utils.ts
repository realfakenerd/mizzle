import { ENTITY_SYMBOLS } from "@repo/shared";
import { Entity, type InferInsertModel } from "./table";
import { Column } from "./column";
import { marshallDates } from "./marshalling";

/**
 * Processes a value object for insertion or update, applying column-level
 * mapping and global date marshalling.
 */
export function processValues<TEntity extends Entity>(
  entity: TEntity,
  values: InferInsertModel<TEntity>,
): Record<string, unknown> {
  const item: Record<string, unknown> = { ...(values as Record<string, unknown>) };
  const columns = entity[ENTITY_SYMBOLS.COLUMNS] as Record<string, Column>;

  for (const key in columns) {
    const col = columns[key];
    if (!col) continue;

    const value = item[key];

    if (value === undefined) {
      if (col.default !== undefined) item[key] = col.default;
      else if (col.defaultFn) item[key] = col.defaultFn();
    }

    const finalValue = item[key];

    // Priority: Column-specific mapping -> Recursive Date marshalling
    if (col instanceof Column) {
      item[key] = col.mapToDynamoValue(finalValue);
    } else {
      item[key] = marshallDates(finalValue);
    }

    const valueAfterMapping = item[key];

    // Handle Sets if the column type suggests it and it's an array
    if (["SS", "NS", "BS"].includes(col.columnType)) {
      if (Array.isArray(valueAfterMapping)) {
        const setVal = new Set(valueAfterMapping);
        item[key] = setVal;
        if (setVal.size === 0) delete item[key];
      }
    }
  }

  // Final pass to catch any fields NOT in schema (dynamic)
  for (const key in item) {
    if (!columns[key]) {
      item[key] = marshallDates(item[key]);
    }
  }

  return item;
}
