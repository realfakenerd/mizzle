---
title: Column Types
description: Reference for all supported column types and their modifiers in Mizzle.
---

Mizzle provides a wide range of column types that map directly to DynamoDB's native data types while providing TypeScript safety and automatic marshalling.

## Basic Types

| Function | DynamoDB Type | Description |
| :--- | :--- | :--- |
| `string(name?)` | `S` | Standard string. |
| `number(name?)` | `N` | Number (automatically handled as strings in DynamoDB). |
| `boolean(name?)` | `BOOL` | Boolean value. |
| `binary(name?)` | `B` | Binary data. |
| `uuid(name?)` | `S` | String formatted as UUID. |
| `date(name?)` | `S` | ISO-8601 Date string. |

## Complex Types

| Function | DynamoDB Type | Description |
| :--- | :--- | :--- |
| `json(name?)` | `S` | JSON object stored as a string. |
| `map(name?)` | `M` | Native DynamoDB Map. |
| `list(name?)` | `L` | Native DynamoDB List. |

## Set Types

| Function | DynamoDB Type | Description |
| :--- | :--- | :--- |
| `stringSet(name?)` | `SS` | Set of unique strings. |
| `numberSet(name?)` | `NS` | Set of unique numbers. |
| `binarySet(name?)` | `BS` | Set of unique binary buffers. |

## Modifiers

All column builders support chaining methods to refine their behavior.

### `.notNull()`

Ensures the column must have a value. In TypeScript, this removes `null` or `undefined` from the inferred type.

```typescript
string("name").notNull()
```

### `.default(value)`

Sets a static default value if no value is provided during insertion.

```typescript
number("views").default(0)
```

### `.$defaultFn(fn)`

Sets a dynamic default value using a function. This is useful for timestamps or random IDs.

```typescript
string("id").$defaultFn(() => crypto.randomUUID())
```

### `.$onUpdateFn(fn)`

Sets a value that is automatically recalculated whenever the record is updated.

```typescript
date("updatedAt").$onUpdateFn(() => new Date())
```

### `.$type<TType>()`

Overrides the inferred TypeScript type. Useful for complex objects in `json` or `map` columns.

```typescript
json("metadata").$type<{ color: string; size: number }>()
```

### `.partitionKey()` & `.sortKey()`

Explicitly marks a column as part of the primary key. While usually configured in the `dynamoTable` definition, these modifiers can be used for secondary indexes.
