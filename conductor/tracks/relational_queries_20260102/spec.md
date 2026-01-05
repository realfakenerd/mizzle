# Specification: Relational Query API (Mizzle RDQ)

## Overview
This track introduces a high-level Relational Query (RDQ) API to Mizzle, providing a "Drizzle-like" and "Prisma-like" experience for fetching related entities. It is specifically optimized for DynamoDB Single-Table Design, allowing multiple related entities to be fetched in a single `Query` command when they share the same Partition Key.

## Functional Requirements

### 1. Configuration & Initialization
- **Optional Relational Context:** The `mizzle()` function will support an object-based configuration: `mizzle({ client, relations })`.
- **Backward Compatibility:** `mizzle(client)` remains supported for standard CRUD operations (`select`, `insert`, etc.), but will not expose the `db.query` API.
- **Flat Schema Structure:** The `relations` object will be a flat schema containing both `dynamoEntity` definitions and their relationship metadata.

### 2. Query API (`db.query`)
- **Proxy-based Access:** Entities provided in the `relations` schema will be accessible via `db.query.<entityName>`.
- **Operations:** Support `findMany()` and `findFirst()`.
- **Options:**
    - `where`: Filter criteria for the primary entity.
    - `with` / `include`: Both keywords supported for fetching related data (Prisma-style `include` and Drizzle-style `with`).
    - `limit`: Restrict the number of primary results.
    - `orderBy`: Sort results (mapping to DynamoDB `ScanIndexForward`).

### 3. Relationship Definitions
- **`defineRelations` Helper:** A new utility to define links between entities.
- **Relationship Types:**
    - **One-to-One (1:1)**
    - **One-to-Many (1:N)**
    - **Many-to-Many (N:M)** (via bridge items or GSI mapping)
- **GSI Support:** Ability to define relations that are resolved via a Global Secondary Index.

### 4. Performance & Single-Table Optimization
- **Single-Query Fetching:** When related items share the same Partition Key as the parent, Mizzle MUST use a single `QueryCommand` and parse the resulting item collection into a structured, nested object.
- **Smart Parsing:** Automatically map flat DynamoDB items to their respective entity definitions based on defined PK/SK prefixes.

## Acceptance Criteria
- [ ] Users can initialize Mizzle with a relational schema.
- [ ] `db.query.<entity>.findMany()` returns typed results including related data.
- [ ] Both `with` and `include` properties correctly trigger relationship fetching.
- [ ] For Single-Table collections, only one network request is made to DynamoDB.
- [ ] Type safety is maintained for deeply nested selections and filters.
- [ ] Documentation includes examples for 1:N and N:M relationships in a Single-Table environment.

## Out of Scope
- Automatic "Joins" for items living in completely different tables (focus is on Single-Table Design efficiency first).
- Complex aggregation functions within the RDQ API.
