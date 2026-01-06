# Mizzle

**Mizzle** is a light and _type-safe_ ORM for **DynamoDB** built with TypeScript. It is designed to provide a "Drizzle-like" developer experience, simplifying your interactions with DynamoDB through a fluid, intuitive API while handling the complexities of Single-Table Design.

## Vision

Mizzle aims to minimize boilerplate and maximize developer velocity. It abstracts away the raw DynamoDB JSON structures and key management, allowing you to define your data models using familiar TypeScript schemas and interact with them using a SQL-like query builder.

## Installation

Install Mizzle and the required AWS SDK dependencies:

```bash
bun add mizzle @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## How It Works

Mizzle separates the concept of the **Physical Table** (the actual DynamoDB table) from the **Entity** (the logical data model). This approach is tailored for DynamoDB's Single-Table Design patterns.

1.  **Physical Table:** Defines the partition key (PK), sort key (SK), and global secondary indexes (GSIs) of your DynamoDB table.
2.  **Entity:** Defines the schema of your data (users, posts, orders) and maps it to the physical table using **Key Strategies**.

Key Strategies (like `prefixKey`) automatically handle the construction of PK/SK values based on your data, so you don't have to manually string-concatenate "USER#123" every time.

## How to Use

### 1. Define the Physical Table

First, define the structure of your DynamoDB table. This matches your `Serverless.yml` or Terraform definition.

```ts
import { dynamoTable, string } from "mizzle";

// Defines the physical table structure
export const myTable = dynamoTable("MyDynamoTable", {
    pk: string("pk"),
    sk: string("sk"),
    // Optional: Define indexes
    // indexes: {
    //   gsi1: gsi("gsi1pk", "gsi1sk")
    // }
});
```

### 2. Define the Entity

Map your logical entity to the physical table. Define columns and the strategy to generate keys.

```ts
import {
    dynamoEntity,
    string,
    uuid,
    number,
    boolean,
    list,
    prefixKey,
    staticKey,
} from "mizzle";

export const user = dynamoEntity(
    myTable,
    "User",
    {
        id: uuid(), // Automatically generates a UUID v7
        name: string(),
        email: string(),
        age: number(),
        isActive: boolean(),
        tags: list(string()),
    },
    (cols) => ({
        // Strategy: Map entity fields to Physical Keys
        // PK becomes "USER#<id>"
        pk: prefixKey("USER#", cols.id),
        // SK becomes "PROFILE" (Static value)
        sk: staticKey("PROFILE"),
    }),
);
```

### 3. Initialize the Client

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "mizzle";

const client = new DynamoDBClient({ region: "us-east-1" });
const db = mizzle(client);
```

### 4. Insert Data

Mizzle automatically resolves the PK and SK based on your strategy and the data provided.

```ts
const newUser = await db.insert(user).values({
    name: "Alice",
    email: "alice@example.com",
    age: 30,
    isActive: true,
    tags: ["typescript", "dynamodb"],
    // 'id' is auto-generated!
}).returning().execute();

console.log(newUser.id); // e.g., "018c..."
console.log(newUser.pk); // "USER#018c..."
```

### 5. Select Data

#### Get Item (By Primary Key)
If you provide enough filters to resolve the Primary Key, Mizzle uses `GetItem`.

```ts
import { eq } from "mizzle";

const result = await db.select().from(user).where(eq(user.id, newUser.id));
// Returns an array with the user
```

#### Query (By Partition Key or Index)
If you provide the Partition Key (and optionally Sort Key), Mizzle uses `Query`.

```ts
// Queries are also supported via GSIs if defined in your schema
const admins = await db.select().from(user).where(eq(user.role, "admin"));
```

#### Scan
If no keys can be resolved, Mizzle defaults to a `Scan` (use with caution!).

```ts
const allUsers = await db.select().from(user).execute();
```

### 6. Update Data

Update items using a fluent builder with support for `set`, `add`, `remove`, and `delete` (for sets).

```ts
await db.update(user)
    .set({ name: "Alice Smith" })
    .add({ age: 1 }) // Increment age
    .where(eq(user.id, "018c..."))
    .execute();
```

## Supported Column Types

Mizzle supports a wide range of DynamoDB types:

*   `string()`: `S`
*   `number()`: `N`
*   `boolean()`: `BOOL`
*   `uuid()`: `S` (Auto-generating UUID v7)
*   `list(type)`: `L`
*   `map({ ... })`: `M`
*   `stringSet()`: `SS`
*   `numberSet()`: `NS`
*   `binary()`: `B`
*   `binarySet()`: `BS`
*   `json()`: `S` (Serialized JSON)

## Roadmap

- [x] **Core Types:** String, Number, Boolean, UUID, List, Map, Sets.
- [x] **Insert Operation:** Type-safe insertion with auto-generated keys.
- [x] **Select Operation:** Intelligent routing to GetItem, Query, or Scan.
- [x] **Key Strategies:** Prefix, Static, and Composite keys.
- [x] **Global Secondary Indexes:** Support for querying GSIs.
- [x] **Update Operation:** Fluent builder for `UpdateItem`.
- [x] **Delete Operation:** Fluent builder for `DeleteItem`.
- [x] **Relational Queries:** `db.query.users.findMany({ with: { posts: true } })`.
- [ ] **Transactions:** `TransactWriteItems` support.
- [ ] **Migration Tools:** CLI for managing table creation/updates.
