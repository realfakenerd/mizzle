# @aurios/mizzle

A Drizzle-like ORM for DynamoDB. Mizzle provides a type-safe, fluent API for interacting with DynamoDB, supporting relational queries, batch operations, and transactions.

## Installation

```bash
npm install @aurios/mizzle
# or
bun add @aurios/mizzle
```

## Usage

### Initialization

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle } from "@aurios/mizzle";

const client = new DynamoDBClient({});
const db = mizzle(client);
```

### Key Features

- **Type-Safe Schema Definition**: Define your tables and entities with strict TypeScript types.
- **Fluent Query Builder**: precise API for `insert`, `select`, `update`, and `delete` operations.
- **Relational Queries**: Query related entities with `db.query`.
- **Batch Operations**: `batchGet` and `batchWrite` support.
- **Transactions**: Atomic operations using `db.transaction`.
- **Automatic Type Inference**: `InferSelectModel` and `InferInsertModel` utilities.

### Example

```ts
// Define your schema (simplified)
import { dynamoTable, dynamoEntity, string } from "@aurios/mizzle";

const myTable = dynamoTable("my-app-table", {
  pk: string("pk"),
  sk: string("sk"),
});

const users = dynamoEntity(myTable, "users", {
  id: string("id"),
  name: string("name"),
  email: string("email"),
});

// Query
const result = await db.select().from(users).where(eq(users.id, "123"));
```

## License

MIT
