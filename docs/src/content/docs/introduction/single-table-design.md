---
title: Single-Table Design
description: Master Single-Table Design patterns in DynamoDB with Mizzle's Key Strategies.
---

Single-Table Design is a powerful pattern in DynamoDB that involves storing multiple logical entities within a single physical table. Mizzle makes this approach intuitive by separating physical table structure from logical entity definitions.

## Why? Why single table

Well, you can use more than one table on DynamoDB, but this isn't cost efficient, neither performant. Single table design is a pattern that allows you to store multiple logical entities within a single physical table.

This pattern is useful when you have a large number of entities that are related to each other, and you want to avoid the overhead of managing multiple tables or even better, we can play an imagining game here, imagine you have a table for users, another for posts, another for comments, and you want to query all of them in a single query.

Let's visualize this with multiple tables:

> Users table
> | id | name |
> | --- | ---- |
> | 1 | John |

> Posts table
> | id | user_id | content |
> | --- | ------- | ------- |
> | 1 | 1 | Hello |
> | 2 | 1 | World |
> | 3 | 1 | ! |

> Comments table
> | id | user_id | post_id | content |
> | --- | ------- | ------- | ------- |
> | 1 | 1 | 1 | Hi |
> | 2 | 1 | 2 | There |

If we need to query these tables in a single query, we would need to use a join them, which can be expensive and complex in DynamoDB. In a SQL table this is the default, but not here, here we do things differently, this is where Single-Table Design comes in handy. With Mizzle, you can define multiple entities in a single table, and query them all in a single query.

## How, to single-table

Well, you saw one of the "whys?" of single-table design. Now lets see how the tables above would look in DynamoDb. We will use the same data, but we will store it in a single table.

First, the **User** table, would be the **User** entity:

| pk         | sk       | name       |
| ---------- | -------- | ---------- |
| USER#1drfj | METADATA | "John Doe" |

Simple, we could use just the user id instead of "USER#<uid>" too, but what about the othe tables?

Here is how the **Post** and **Comments** table turns into an entity:

| pk                    | sk            | name       | content                    |
| --------------------- | ------------- | ---------- | -------------------------- |
| USER#1drfj            | METADATA      | "John Doe" |                            |
| USER#1drfj            | POST#2jdhg    |            | "Hello world!"             |
| USER#1drfj            | POST#3tslm    |            | "Hello world The sequence" |
| USER#1drfj#POST#2jdhg | COMMENT#34djs |            | "Hi back"                  |

Why this is good? If we want to query all the posts of an particular user, we can select all the items that have the pk "USER#1drfj" and the sk starts with "POST#", and we can get all the posts of that user in a single request, mindblowing right?.

But what if we want to get all the comments of a post? We can do the same, select all the items that have the pk "USER#1drfj#POST#2jdhg" and the sk starts with "COMMENT#", and we can get all the comments of that post in a single request, amazing!.

## Key Strategies

Key Strategies are functions that define how your logical entity fields are mapped to the physical Partition Key (PK) and Sort Key (SK).

### `staticKey`

Used for keys that have a constant value for every item of a particular entity type.

```typescript
import { staticKey } from "@aurios/mizzle";

// SK will always be "METADATA" for this entity
sk: staticKey("METADATA");
```

### `prefixKey`

Commonly used for Partition Keys to group entities while keeping them unique.

```typescript
import { prefixKey } from "@aurios/mizzle";

// PK will be "USER#<id>"
pk: prefixKey("USER#", cols.id);
```

### `compositeKey`

Useful for Sort Keys where you want to hierarchical data or multiple attributes combined.

```typescript
import { compositeKey } from "@aurios/mizzle";

// SK will be "ORG#<orgId>#DEPT#<deptId>"
sk: compositeKey("#", "ORG", cols.orgId, "DEPT", cols.deptId);
```

## Designing Your Table

When using Single-Table Design, your physical table usually has generic names for its keys.

```typescript
import { dynamoTable, string } from "@aurios/mizzle";

export const mainTable = dynamoTable("MainTable", {
  pk: string("pk"),
  sk: string("sk"),
});
```

## Mapping Entities

You can map multiple entities to the same `mainTable`.

```typescript
import { dynamoEntity, uuid, string, prefixKey, staticKey } from "@aurios/mizzle";
import { mainTable } from "./schema";

// User Entity
export const users = dynamoEntity(
  mainTable,
  "User",
  {
    id: uuid(),
    name: string(),
  },
  (cols) => ({
    pk: prefixKey("USER#", cols.id),
    sk: staticKey("PROFILE"),
  }),
);

// Order Entity
export const orders = dynamoEntity(
  mainTable,
  "Order",
  {
    id: uuid(),
    userId: uuid(),
    amount: number(),
  },
  (cols) => ({
    pk: prefixKey("USER#", cols.userId),
    sk: prefixKey("ORDER#", cols.id),
  }),
);
```

## Benefits of This Approach

- **Automatic Key Resolution:** When you `insert` or `update`, Mizzle automatically builds the PK and SK based on the provided data.
- **Intelligent Routing:** When you `select`, Mizzle looks at your `where` clauses to see if they satisfy the PK/SK requirements of the table or any Global Secondary Index.
- **Type Safety:** You work with logical fields (like `userId`), and Mizzle handles the string concatenation for the physical keys safely.
