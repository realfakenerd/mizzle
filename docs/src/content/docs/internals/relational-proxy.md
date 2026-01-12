---
title: Relational Proxy & Parser
description: How Mizzle fetches and assembles related data.
---

Mizzle provides a powerful relational API (`db.query.users.findMany({ with: { posts: true } })`). Under the hood, this is powered by two key components: the **Relational Proxy** and the **ItemCollectionParser**.

## The Challenge

DynamoDB is a NoSQL database. Unlike SQL, it doesn't have `JOIN`s. To simulate relational data fetching, Mizzle uses two strategies:

1.  **Single-Table Optimization:** If the related items share the same Partition Key (PK), Mizzle fetches them all in a single request and reassembles them in memory.
2.  **Recursive Fetching:** If the related items are in different partitions (e.g., accessed via a GSI or direct lookup), Mizzle performs parallel follow-up requests.

## 1. Item Collection Parser (Single-Table Design)

When you query a Partition Key that contains multiple entity types (e.g., `PK=USER#123` contains the User profile AND their Posts), DynamoDB returns a flat list of items.

The `ItemCollectionParser` (in `packages/mizzle/src/core/parser.ts`) is responsible for turning this flat list into a nested object structure.

### How it works:

1.  **Identification:** The parser iterates through the raw items and checks each one against the defined `KeyStrategy` for every known entity in the schema.
    - Does this item's `sk` start with "METADATA"? -> It's a User.
    - Does this item's `sk` start with "POST#"? -> It's a Post.
2.  **Separation:** It separates the "Primary" items (the ones you explicitly queried for) from the "Related" items.
3.  **Association:** It loops through the primary items and attaches the related items based on the schema definition (One-to-One or One-to-Many).

## 2. Recursive Fetching (RelationalQueryBuilder)

If the data cannot be found in the same partition, the `RelationalQueryBuilder` (in `packages/mizzle/src/builders/relational-builder.ts`) takes over.

### The Algorithm:

1.  **Primary Fetch:** Executes the initial query for the root entities.
2.  **Inspection:** Checks the `with` or `include` options to see what relations are requested.
3.  **Key Resolution:** For each relation:
    - Extracts the necessary references from the parent item (e.g., `authorId` from a `Post`).
    - Uses the `KeyStrategy` of the target entity to construct the lookup keys (e.g., `PK=USER#<authorId>`).
4.  **Parallel Execution:** Triggers parallel `GetItem` or `Query` operations for the related data.
5.  **Stitching:** Assigns the results back to the parent object.

This recursive process allows Mizzle to traverse deep graphs of data (e.g., User -> Posts -> Comments) efficiently, although developers should be mindful of the "N+1" query problem inherent in this approach for large datasets.