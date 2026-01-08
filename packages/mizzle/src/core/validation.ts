/**
 * Estimating the byte size of a DynamoDB item.
 * Reference: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/CapacityUnitCalculations.html
 */
export function calculateItemSize(item: Record<string, unknown>): number {
    let size = 0;

    for (const [key, value] of Object.entries(item)) {
        // Attribute name size
        size += Buffer.byteLength(key, "utf8");

        size += calculateValueSize(value);
    }

    return size;
}

function calculateValueSize(value: unknown): number {
    if (value === null || value === undefined) {
        return 1; // NULL
    }

    if (typeof value === "string") {
        return Buffer.byteLength(value, "utf8");
    }

    if (typeof value === "number") {
        // Numbers are up to 38 significant digits. 
        // In DynamoDB, they are stored as variable length.
        // Rule of thumb: length of string representation + extra byte.
        // AWS Doc: "Numbers are stored in a compressed format... up to 21 bytes."
        // We'll use a conservative estimate.
        return 21;
    }

    if (typeof value === "boolean") {
        return 1;
    }

    if (value instanceof Buffer || value instanceof Uint8Array) {
        return value.byteLength;
    }

    if (Array.isArray(value)) {
        // List: 3 bytes overhead + sum of elements
        let listSize = 3;
        for (const item of value) {
            listSize += calculateValueSize(item);
        }
        return listSize;
    }

    if (value instanceof Set) {
        // Set: overhead? usually treated like List or similar.
        // AWS says: "size of all the elements plus the size of the attribute name."
        // We'll estimate it like a List for safety.
        let setSize = 3;
        for (const item of value) {
            setSize += calculateValueSize(item);
        }
        return setSize;
    }

    if (typeof value === "object") {
        // Map: 3 bytes overhead + attribute names + attribute values
        let mapSize = 3;
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            mapSize += Buffer.byteLength(k, "utf8");
            mapSize += calculateValueSize(v);
        }
        return mapSize;
    }

    return 0;
}
