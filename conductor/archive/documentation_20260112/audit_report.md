# Documentation Audit Report

## Public API Surface (`packages/mizzle`)

### Core

- `db`: Main entry point (`DynamoDBClient` wrapper).
- `table`: `dynamoTable`, `dynamoEntity`, `Entity`, `PhysicalTable`.
- `columns`: Column definitions (`string`, `number`, `boolean`, `binary`, `list`, `map`, `set`, `uuid`, `json`).
- `indexes`: `gsi`, `lsi`.

### Builders (Fluent API)

- `SelectBuilder` / `SelectBase`: `.select().from().where()...`
- `InsertBuilder` / `InsertBase`: `.insert().values()...`
- `UpdateBuilder`: `.update().set().where()...`
- `DeleteBuilder`: `.delete().where()...`
- `TransactionBuilder` / `TransactionProxy`: `db.transaction(...)`
- `BatchGetBuilder`, `BatchWriteBuilder`: `db.batch.get(...)`, `db.batch.write(...)`
- `RelationalQueryBuilder`: Logic for `.findMany`, `.findFirst` with `with/include`.

### Expressions

- `operators`: `eq`, `ne`, `gt`, `lt`, `ge`, `le`, `between`, `beginsWith`, `contains`, `inArray`, `and`, `or`, `not`, `attributeExists`, `attributeNotExists`, `attributeType`, `size`.
- `actions`: `set`, `add`, `remove`, `delete` (for updates).

### Shared (`packages/shared`)

- `constants`: `TABLE_SYMBOLS`, `ENTITY_SYMBOLS`.
- `utils`: Helper functions.

## Internal Logic Candidates

### Expression Builder

- **Source:** `packages/mizzle/src/expressions/builder.ts`, `packages/mizzle/src/expressions/update-builder.ts`
- **Description:** Converts high-level operator objects into DynamoDB Expression Strings and Attribute Values. Needs explanation on how it handles name substitution (`#n0`) and value substitution (`:v0`).

### Relational Logic

- **Source:** `packages/mizzle/src/builders/relational-builder.ts`, `packages/mizzle/src/core/parser.ts`
- **Description:**
  - `RelationalQueryBuilder`: Handles fetching related data (recursive fetches vs single-table optimization).
  - `ItemCollectionParser`: Parses flat DynamoDB items into nested objects based on the Single-Table Design schema.

### Retry & Resilience

- **Source:** `packages/mizzle/src/core/retry.ts`, `packages/mizzle/src/core/client.ts`
- **Description:** Logic for exponential backoff and jitter handling.
