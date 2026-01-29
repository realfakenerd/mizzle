# 🌧️ mizzle

A Drizzle-like ORM for DynamoDB. Mizzle provides a type-safe, fluent API for interacting with DynamoDB, supporting relational queries, batch operations, and transactions.

## Key Features

- **Type-Safe Schema Definition**: Define your tables and entities with strict TypeScript types.
- **Fluent Query Builder**: precise API for `insert`, `select`, `update`, and `delete` operations.
- **Relational Queries**: Query related entities with `db.query`.
- **Batch Operations**: `batchGet` and `batchWrite` support.
- **Transactions**: Atomic operations using `db.transaction`.
- **Automatic Type Inference**: `InferSelectModel` and `InferInsertModel` utilities.

> Skip this with the [way less boring docs](https://mizzle-docs.vercel.app)

## 🚀 Installation

```bash
npm install @aurios/mizzle
# or
bun add @aurios/mizzle
```

## Get Started

### Defining the Table

In DynamoDB, you first need a physical table. Mizzle separates the definition of the physical table structure (PK, SK, Indexes) from the logical entities that live within it and with this making your database well organized and easier to reason about.

```ts
import { dynamoTable, string } from "@aurios/mizzle";

// This matches your actual DynamoDB table configuration
export const myTable = dynamoTable("JediOrder", {
  pk: string("pk"), // The partition key attribute name
  sk: string("sk"), // The sort key attribute name (optional)
});
```

### Defining the Entity

An Entity represents your data model (e.g., an user, an item on an user). You map the Entity to a Physical Table and define how its keys are generated, so every entity looks kinda like an separated table.

```ts
import { dynamoEntity, string, uuid, number, enum, date, prefixKey, staticKey } from "@aurios/mizzle";

export const jedi = dynamoEntity(
  myTable,
  "Jedi",
  {
    id: uuid(), // Automatically generates a v7 UUID
    name: string(),
    homeworld: string()
  },
  (cols) => ({
    // PK will look like "JEDI#<uuid>"
    pk: prefixKey("JEDI#", cols.id),
    // SK will be a static string "PROFILE"
    sk: staticKey("PROFILE"),
  }),
);

export const jediRank = dynamoEntity(
  myTable,
  'JediRank',
  {
    jediId: uuid(),
    position: string().default('initiate'),
    joinedCouncilDate: string(),
  },
  (cols) => ({
    // Same as the jedi so they can be related
    pk: prefixKey('JEDI#', cols.jediId),
    // RANK#initiate
    sk: prefixKey('RANK#', cols.position),
  })
)
```

> The UUID V7 was chosen for better sorting, since the values are time-sortable with 1 millisecond precision.

### Define the Relations

Relationships in Mizzle are established using the defineRelations function. This step creates a logical map of how your entities interact, enabling you to perform powerful relational queries—such as fetching a Jedi along with their entire rank history—in a single operation.

```ts
import { defineRelations } from "@aurios/mizzle";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  jedi: {
    // A Jedi could've a lot of ranks throughout his year
    ranks: r.many.jediRank({
      fields: [r.jedi.id],
      references: [r.jediRank.jediId],
    }),
  },
  jediRank: {
    // Every registry points to one Jedi only
    member: r.one.jedi({
      fields: [r.jediRank.jediId],
      references: [r.jedi.id],
    }),
  },
}));
```

### Initialization

Initialize the mizzle client by passing it an instance of the standard AWS DynamoDBClient and the relations we just defined.

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "@aurios/mizzle";
import { relations } from "./relations";

const client = new DynamoDBClient({ region: "us-east-1" });
export const db = mizzle({ client, relations });
```

### Query

Now you can use the fluent API to interact with your data in the best way possible.

#### Insert Data

```typescript
// api/jedi/new.ts
import { jedi } from "$lib/schema.ts";

const newJedi = await db
  .insert(jedi)
  .values({
    name: "Luke Skywalker",
    homeworld: "Tatooine",
  })
  .returning();

console.log(newJedi.id); // The auto-generated UUID
```

#### Select Data

Mizzle intelligently routes your request to `GetItem`, `Query`, or `Scan` based on the filters you provide.

```typescript
// /api/jedi/get.ts
import { jedi } from "$lib/schema.ts";
import { eq } from "@aurios/mizzle";

// This will use GetItem because both PK and SK are fully resolved
const user = await db.select().from(jedi).where(eq(jedi.id, "some-uuid")).execute();
```

## Mizzling

This will work if you already has a DynamoDB table with data in it. If you want to create a new table with the schema you defined, you can use the [`mizzling`](https://www.npmjs.com/package/@aurios/mizzling) CLI.

## 📄 License

This project is licensed under the MIT License.
