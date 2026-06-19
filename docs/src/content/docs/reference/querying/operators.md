---
title: Operators
description: Reference for Mizzle's query operators (where clause).
---

Operators are used within `.where()` clauses to filter your data. Mizzle intelligently maps these to DynamoDB's `KeyConditionExpression` (for efficient indexed queries) or `FilterExpression`.

## Comparison Operators

| Function | DynamoDB Operator | Description |
| :--- | :--- | :--- |
| `eq(col, val)` | `=` | Equal to. |
| `gt(col, val)` | `>` | Greater than. |
| `gte(col, val)` | `>=` | Greater than or equal to. |
| `lt(col, val)` | `<` | Less than. |
| `lte(col, val)` | `<=` | Less than or equal to. |
| `between(col, [v1, v2])` | `BETWEEN` | Between two values (inclusive). |
| `inList(col, [v1, v2, ...])` | `IN` | Value is in a list. |

## Function Operators

| Function | DynamoDB Function | Description |
| :--- | :--- | :--- |
| `beginsWith(col, string)` | `begins_with` | String starts with prefix. |
| `contains(col, val)` | `contains` | Collection contains value or string contains substring. |
| `attributeExists(col)` | `attribute_exists` | Checks if attribute exists on the item. |

## Logical Operators

| Function | DynamoDB Operator | Description |
| :--- | :--- | :--- |
| `and(...expr)` | `AND` | Combines multiple expressions with AND. |
| `or(...expr)` | `OR` | Combines multiple expressions with OR. |

## Usage Example

```typescript
import { eq, and, gt } from "@aurios/mizzle";

db.select()
  .from(users)
  .where(
    and(
      eq(users.status, "active"),
      gt(users.age, 18)
    )
  )
```
