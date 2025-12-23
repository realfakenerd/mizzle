# mizzle

mizzle it's an light and _type-safe_ ORM for **DynamoDB** built with Typescript. Projected to simplify your life with DynamoDB with fluidity.

## Instalation

Install it and the AWS SDK dependendcies:

```bash
bun add mizzle @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

# How to

### 1. Define the table:

First, define the structure of your DynamoDB table (the physical table where the data will live).

```ts
import { dynamoTable, string } from "mizzle";

// Defines the physical table
export const myTable = dynamoTable("MyDynamoTable", {
    pk: string("pk").partitionKey(),
    sk: string("sk").sortKey(),
});
```

### 2. Define the entity:

Since DynamoDB uses a single-table design, different from `drizzle` i needed a way to define multiple virtual tables inside a physical table, multiple entities.

So map the entity to the physical table. Here you define the columns of your application and how they translate to the keys of `DynamoDB`

```ts
import {
    dynamoEntity,
    string,
    uuid,
    number,
    prefixKey,
    staticKey,
} from "mizzle";

export const user = dynamoEntity(
    myTable,
    "User",
    {
        id: uuid(), // Automacally generates a V7 UUID, well suited for sorting
        name: string(),
        email: string().email(), // Validates to an email string
        age: number(), // Can use the .min|max validation too
    },
    (cols) => ({
        // Strategy map user key to PK/SK
        // Ex: PK = "USER#<id>", SK = "PROFILE"
        pk: prefixKey("USER#", cols.id),
        sk: staticKey("PROFILE"),
    }),
);
```

### 3. Executing operations:

Initialize the client and execute queries.

```ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mizzle, eq } from "mizzle";
import { user } from "./schema";

const client = new DynamoDBClient({ region: "us-east-1" });
const db = mizzle(client);

await db
    .insert(user)
    .values({
        name: "Real Fake Nerd",
        email: "nerd@example.com",
        age: 30,
        // 'id' is automatically generated if not provided
    })
    .execute();

const result = await db
    .select()
    .from(user)
    .where(eq(user.id, "random-uid"))
    .execute();
```

## Supported column types

Mizzle supports all DynamoDB data types and more:
`string()`, `stringSet()`, `number()`, `numberSet()`, `boolean()`, `binary()`, `binarySet()`, `list()`, `map()`, `json()`, `uuid()`

> `json()` automatically stringify and parses the data.
> `map()` almost like the json type, but it does not stringify the data. It is the "M" on Dynamo.
