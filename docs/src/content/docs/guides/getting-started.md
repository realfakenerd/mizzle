---
title: Getting Started
description: Learn how to install and set up Mizzle in your TypeScript project.
---

Mizzle is a light and type-safe ORM for DynamoDB. This guide will walk you through the initial setup, from installation to running your first query.

## Installation

Install Mizzle along with the required AWS SDK dependencies using your preferred package manager:

```bash
# Using Bun
bun add mizzle @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Using npm
npm install mizzle @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Using pnpm
pnpm add mizzle @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## Step 1: Define the Physical Table

In DynamoDB, you first need a physical table. Mizzle separates the definition of the physical table structure (PK, SK, Indexes) from the logical entities that live within it.

Create a `schema.ts` file:

```typescript
import { dynamoTable, string } from "mizzle";

// This matches your actual DynamoDB table configuration
export const myTable = dynamoTable("MyApplicationTable", {
  pk: string("pk"), // The partition key attribute name
  sk: string("sk"), // The sort key attribute name (optional)
});
```

## Step 2: Define a Logical Entity

An Entity represents your data model (e.g., a User). You map the Entity to a Physical Table and define how its keys are generated.

```typescript
import { dynamoEntity, string, uuid, number, prefixKey, staticKey } from "mizzle";
import { myTable } from "./schema";

export const users = dynamoEntity(
  myTable,
  "User",
  {
    id: uuid(), // Automatically generates a v7 UUID
    name: string(),
    email: string(),
    age: number(),
  },
  (cols) => ({
    // PK will look like "USER#<uuid>"
    pk: prefixKey("USER#", cols.id),
    // SK will be a static string "PROFILE"
    sk: staticKey("PROFILE"),
  })
);
```

## Step 3: Initialize the Client

Initialize the `mizzle` client by passing it an instance of the standard AWS `DynamoDBClient`.

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle";

const client = new DynamoDBClient({ region: "us-east-1" });
export const db = mizzle(client);
```

## Step 4: Perform Your First Query

Now you can use the fluent API to interact with your data.

### Insert Data

```typescript
const newUser = await db.insert(users).values({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
}).returning().execute();

console.log(newUser.id); // The auto-generated UUID
```

### Select Data

Mizzle intelligently routes your request to `GetItem`, `Query`, or `Scan` based on the filters you provide.

```typescript
import { eq } from "mizzle";

// This will use GetItem because both PK and SK are fully resolved
const user = await db.select()
  .from(users)
  .where(eq(users.id, "some-uuid"))
  .execute();
```

## Next Steps

- Explore [Single-Table Design](/guides/single-table-design/) patterns.
- Check the [API Reference](/reference/select/) for detailed method documentation.
- Learn about the [CLI Reference](/cli-reference/) for managing migrations.
