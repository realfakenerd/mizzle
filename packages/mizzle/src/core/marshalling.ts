/**
 * Recursively converts Date objects to ISO strings.
 * This is necessary because the AWS SDK DynamoDB Document Client does not
 * support native JavaScript Date objects by default.
 */
export function marshallDates(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(marshallDates);
  }

  if (value instanceof Set) {
    const newSet = new Set();
    for (const item of value) {
      newSet.add(marshallDates(item));
    }
    return newSet;
  }

  if (value !== null && typeof value === "object" && !(value instanceof Buffer) && !(value instanceof Uint8Array)) {
    const record = value as Record<string, unknown>;
    const newObj: Record<string, unknown> = {};
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        newObj[key] = marshallDates(record[key]);
      }
    }
    return newObj;
  }

  return value;
}
