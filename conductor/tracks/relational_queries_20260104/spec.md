# Specification: Relational Queries (Adjacency List Pattern)

## Overview
Implement a Drizzle-style relational query API for Mizzle. This will allow developers to define relationships between entities and fetch related data (one-to-many, many-to-many, belongs-to) using a high-level `db.query` API. The implementation will focus on the Adjacency List pattern, optimized for DynamoDB single-table design using Global Secondary Indexes (GSIs).

## Functional Requirements

### 1. Relationship Definition
-   **`relations` function:** Provide a function to define relationships between tables.
    ```typescript
    export const usersRelations = relations(users, ({ many }) => ({
      posts: many(posts),
    }));
    ```
-   **`many` and `one` helpers:** Support defining one-to-many (`many`) and many-to-one/one-to-one (`one`) relationships.

### 2. Client Initialization
-   **Relations Configuration:** Update the `mizzle()` function to accept an optional configuration object where `relations` can be passed.
    ```typescript
    // db.ts
    import * as schema from './schema'; // schema contains relations exports
    const db = mizzle({ client, relations: schema });
    ```
    *(Note: The `client` is also passed in this object or as a separate argument, but the key change is accepting `relations`)*

### 3. Relational Query API (`db.query`)
-   **Fluent Interface:** Implement `db.query.<entity>.findMany` and `db.query.<entity>.findFirst`.
-   **`with` operator:** Support fetching related entities.
    ```typescript
    const result = await db.query.users.findMany({
      with: {
        posts: true
      }
    });
    ```
-   **Filtering & Pagination:** Support `where` and `limit` within the relational query.

### 4. DynamoDB Execution (Adjacency List)
-   **GSI Utilization:** For "One-to-Many" queries using the Adjacency List pattern, the query builder should automatically determine the correct GSI and PK/SK values to fetch both parent and child items in a single DynamoDB `Query` call.
-   **Result Transformation:** Automatically group the flat items returned by DynamoDB into the expected nested object structure.

## Non-Functional Requirements
-   **Type Safety:** The `db.query` API must be 100% type-safe, correctly inferring the nested result types based on the `with` configuration.
-   **Performance:** Prioritize single `Query` operations over multiple requests whenever possible.

## Acceptance Criteria
-   Developers can define `relations` for their tables.
-   `mizzle({ client, relations })` correctly initializes the query API.
-   `db.query.users.findMany({ with: { posts: true } })` returns users with a nested `posts` array.
-   The implementation correctly handles one-to-many and belongs-to relations.
-   Unit and integration tests verify the Adjacency List fetching logic.

## Out of Scope
-   Automatic creation of GSIs (schema management).
-   Complex join logic across different physical tables (Mizzle focuses on Single-Table Design).
