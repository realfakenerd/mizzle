---
title: Single-Table Design
description: Master Single-Table Design patterns in DynamoDB with Mizzle's Key Strategies.
---

Single-Table Design is a powerful structural pattern in DynamoDB where multiple logical entities (e.g., Users, Posts, and Comments) are co-located in a single physical table. Mizzle makes this approach intuitive by separating physical table structure from logical entity definitions.

---

## Why Single-Table Design?

In relational databases (SQL), you create a separate table for every type of data and connect them using relationships and `JOIN` operations. 

In DynamoDB, however, tables are isolated. Doing the equivalent of a "join" would require making multiple separate network requests, which is slow and expensive. 

Single-Table Design solves this by **pre-joining** your data. By storing related items in the same physical table and arranging their primary keys strategically, you can retrieve a parent entity and all its related child entities in a **single query request**.

---

## How It Works

To make single-table design work, we must address two key concepts:

### 1. Generic Primary Keys
Because different entities live in the same table, we cannot name our primary keys `userId` or `postId`. Instead, we define a physical table with generic keys: a partition key (`pk`) and an optional sort key (`sk`).

### 2. Schemaless Attributes
DynamoDB only requires you to define the primary keys (`pk` and `sk`) ahead of time. All other attributes (like `username`, `email`, or `content`) are schemaless and are written dynamically. This allows a User item and a Post item to exist on different rows with completely different sets of columns.

---

## Visualizing the Table

Consider a physical table named `MainTable`. Here is how a User, their Posts, and Comments are stored side-by-side:

| pk (Partition Key)    | sk (Sort Key) | name       | content                    | email             |
| :-------------------- | :------------ | :--------- | :------------------------- | :---------------- |
| **USER#1drfj**        | `METADATA`    | "John Doe" | *null*                     | john@example.com  |
| **USER#1drfj**        | `POST#2jdhg`  | *null*     | "Hello world!"             | *null*            |
| **USER#1drfj**        | `POST#3tslm`  | *null*     | "Hello world The sequence" | *null*            |
| **USER#1drfj#POST#2jdhg** | `COMMENT#34djs` | *null* | "Hi back"                  | *null*            |

### Query Examples:
*   **Get User Profile & All Posts**: Query where `pk = USER#1drfj`. Because the user profile and their posts share the same partition key, DynamoDB returns all three rows in one round-trip.
*   **Get Comments for a Post**: Query where `pk = USER#1drfj#POST#2jdhg` and `sk` starts with `COMMENT#`.

---

## Defining It with Mizzle

Mizzle automates the translation between your clean TypeScript structures and the raw, prefixed string keys shown in the table above.

### Step 1: Define the Physical Table
Define the physical table using generic keys:

```typescript
import { dynamoTable, string } from "@aurios/mizzle";

export const mainTable = dynamoTable("MainTable", {
  pk: string("pk"),
  sk: string("sk"),
});
```

### Step 2: Define Logical Entities (with Key Strategies)
Key Strategies tell Mizzle how to construct the physical `pk` and `sk` from your logical fields.

```typescript
import { dynamoEntity, uuid, string, prefixKey, staticKey } from "@aurios/mizzle";
import { mainTable } from "./schema";

export const users = dynamoEntity(
  mainTable,
  "User",
  {
    id: uuid(),
    name: string(),
    email: string(),
  },
  (cols) => ({
    // If user.id = "1drfj", pk becomes "USER#1drfj"
    pk: prefixKey("USER#", cols.id),
    // sk is static; every user profile has the exact same sk
    sk: staticKey("METADATA"),
  }),
);
```

When you insert a user:
```typescript
await db.insert(users).values({
  name: "John Doe",
  email: "john@example.com",
});
```
Mizzle automatically generates the UUID `id` (e.g., `"1drfj"`), prefixes it to construct `pk = "USER#1drfj"`, sets `sk = "METADATA"`, and saves the item.

---

## Key Strategies Reference

Mizzle provides three built-in helpers to construct your primary keys dynamically:

### 1. `staticKey`
Sets a constant string value for the key. Usually used for sort keys of profile/metadata records.
```typescript
sk: staticKey("METADATA") // Resolves to: "METADATA"
```

### 2. `prefixKey`
Combines a static string prefix with a dynamic attribute value.
```typescript
pk: prefixKey("USER#", cols.id) // Resolves to: "USER#123"
```

### 3. `compositeKey`
Combines multiple static prefixes and dynamic attributes using a delimiter. Crucial for modeling deep hierarchies.
```typescript
// Resolves to: "ORG#google#DEPT#search"
sk: compositeKey("#", "ORG", cols.orgId, "DEPT", cols.deptId)
```

---

## Summary of Benefits

- **Automatic Serialization**: You work with clean logical objects in TypeScript; Mizzle maps them to and from the physical generic key layout.
- **Auto Routing**: When you use `db.select().from(users).where(eq(users.id, "123"))`, Mizzle automatically infers that it needs to query `pk = USER#123` and `sk = METADATA` under the hood.
- **Type Safety**: Your queries use the clean fields defined on your logical entities (`users.id`), eliminating manual string interpolation bugs.
