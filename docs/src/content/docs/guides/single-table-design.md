---
title: Single-Table Design
description: Master Single-Table Design patterns in DynamoDB with Mizzle's Key Strategies.
---

Single-Table Design is a powerful pattern in DynamoDB that involves storing multiple logical entities within a single physical table. Mizzle makes this approach intuitive by separating physical table structure from logical entity definitions.

## Key Strategies

Key Strategies are functions that define how your logical entity fields are mapped to the physical Partition Key (PK) and Sort Key (SK).

### `staticKey`

Used for keys that have a constant value for every item of a particular entity type.

```typescript
import { staticKey } from "mizzle";

// SK will always be "METADATA" for this entity
sk: staticKey("METADATA")
```

### `prefixKey`

Commonly used for Partition Keys to group entities while keeping them unique.

```typescript
import { prefixKey } from "mizzle";

// PK will be "USER#<id>"
pk: prefixKey("USER#", cols.id)
```

### `compositeKey`

Useful for Sort Keys where you want to hierarchical data or multiple attributes combined.

```typescript
import { compositeKey } from "mizzle";

// SK will be "ORG#<orgId>#DEPT#<deptId>"
sk: compositeKey("#", "ORG", cols.orgId, "DEPT", cols.deptId)
```

## Designing Your Table

When using Single-Table Design, your physical table usually has generic names for its keys.

```typescript
import { dynamoTable, string } from "mizzle";

export const mainTable = dynamoTable("MainTable", {
  pk: string("pk"),
  sk: string("sk"),
});
```

## Mapping Entities

You can map multiple entities to the same `mainTable`.

```typescript
import { dynamoEntity, uuid, string, prefixKey, staticKey } from "mizzle";
import { mainTable } from "./schema";

// User Entity
export const users = dynamoEntity(mainTable, "User", {
    id: uuid(),
    name: string(),
  },
  (cols) => ({
    pk: prefixKey("USER#", cols.id),
    sk: staticKey("PROFILE"),
  })
);

// Order Entity
export const orders = dynamoEntity(mainTable, "Order", {
    id: uuid(),
    userId: uuid(),
    amount: number(),
  },
  (cols) => ({
    pk: prefixKey("USER#", cols.userId),
    sk: prefixKey("ORDER#", cols.id),
  })
);
```

## Benefits of This Approach

- **Automatic Key Resolution:** When you `insert` or `update`, Mizzle automatically builds the PK and SK based on the provided data.
- **Intelligent Routing:** When you `select`, Mizzle looks at your `where` clauses to see if they satisfy the PK/SK requirements of the table or any Global Secondary Index.
- **Type Safety:** You work with logical fields (like `userId`), and Mizzle handles the string concatenation for the physical keys safely.
