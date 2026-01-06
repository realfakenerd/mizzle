# Initial Concept

A light and type-safe ORM for DynamoDB built with TypeScript.

## Vision

Mizzle is a light and type-safe ORM for DynamoDB built with TypeScript. It is designed to provide a "Drizzle-like" developer experience, making it intuitive and fast for developers to interact with DynamoDB without the usual boilerplate and complexity.

## Target Audience

- TypeScript developers building applications on AWS.
- Teams seeking a familiar, fluent API for DynamoDB that mirrors the ergonomics of SQL-based ORMs like Drizzle.

## Core Goals

- **Developer Velocity:** Minimize boilerplate when defining tables and entities.
- **Type Safety:** Ensure 100% type safety for queries, updates, and schema definitions.
- **Single-Table Design Made Easy:** Provide first-class support for advanced single-table design patterns (key prefixing, static keys, etc.) with minimal configuration.

## Key Features

- **Fluent Query Builder:** A familiar `db.select()`, `db.update()`, and `db.delete()` API for intuitive data access and modification, mirroring the ergonomics of Drizzle ORM.
- **Relational Query API:** A high-level `db.query` API for fetching related entities with nested results, optimized for Single-Table Design performance (fetching collections in a single round-trip).
- **Smart Key Management:** Automatic UUID generation (v7) and flexible key prefixing strategies to handle complex partition and sort key requirements.
- **Entity Mapping:** Seamlessly map application-level entities to physical DynamoDB tables.
    - **Migration CLI (`mizzling`):** A dedicated CLI package for managing DynamoDB schema, supporting snapshots, automated migration scripts, interactive initialization, and table management.
    - **Modular Library:** The core library supports clean subpath imports like `mizzle/columns` and `mizzle/table` for a better developer experience.- **Flexible Configuration:** Enhanced support for multiple environments via AWS Profiles, explicit credentials, and environment variable overrides (`MIZZLE_REGION`, `MIZZLE_ENDPOINT`, etc.).

## Constraints & Requirements

- **Performance:** Maintain high performance with minimal overhead relative to the native AWS SDK.
- **Dependencies:** Lightweight runtime footprint, relying primarily on the AWS SDK and essential utilities like `uuid`.
