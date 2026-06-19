---
title: Overview
description: Overview of Mizzle, a light and type-safe ORM for DynamoDB.
---

Mizzle is a lightweight, type-safe ORM for DynamoDB built with TypeScript. It is designed to provide a Drizzle-like developer experience, making it fast and intuitive to interact with DynamoDB without writing verbose boilerplate.

Born out of a need to combine DynamoDB's scalability with Drizzle ORM's clean developer experience, Mizzle lets you query DynamoDB using a highly familiar, fluent API. From its inception, the project has prioritized developer velocity, robust type safety, and code simplicity.

## Vision

The vision for Mizzle is to bring the ergonomics of SQL-based ORMs (like Drizzle) to the NoSQL world of DynamoDB. Interacting with DynamoDB shouldn't mean sacrificing type safety, dealing with complex expression attribute values, or compromising developer velocity.

## Core Goals

- **High Developer Velocity:** Minimize the boilerplate required to define physical tables, logical entities, and indexes.
- **Type Safety:** Provide 100% type safety for queries, updates, deletes, and schema definitions.
- **Simplified Single-Table Design:** Provide first-class, built-in support for advanced single-table design patterns (key prefixing, static keys, composite keys) with minimal configuration.

## Key Features

- **Fluent Query Builder**: A familiar SQL-like API using `db.select()`, `db.insert()`, `db.update()`, and `db.delete()` for intuitive data access.
- **Relational Query API**: A high-level `db.query` API designed for retrieving nested relation structures, optimized for Single-Table Design—fetching complex relation graphs in a single database round-trip.
- **Smart Key Management**: Automatic UUID generation (v7) and key prefixing strategies to handle complex partition and sort key requirements seamlessly.
- **Migration CLI (`mizzling`)**: A dedicated command-line interface for managing DynamoDB schemas, supporting schema snapshots, automated migration scripts, and interactive setup.

## Target Audience

- **TypeScript & Node.js/Bun Developers** building applications on AWS.
- **Teams** seeking a familiar, fluent API for DynamoDB that mirrors the developer experience of relational ORMs without the management overhead of multiple tables.
