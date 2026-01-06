---
title: Introduction
description: Overview of Mizzle, a light and type-safe ORM for DynamoDB.
---

Mizzle is a light and type-safe ORM for DynamoDB built with TypeScript. It is designed to provide a "Drizzle-like" developer experience, making it intuitive and fast for developers to interact with DynamoDB without the usual boilerplate and complexity.

## Vision

The vision for Mizzle is to bring the ergonomics of SQL-based ORMs like Drizzle to the world of DynamoDB. We believe that interacting with NoSQL shouldn't mean sacrificing type safety or developer velocity.

## Core Goals

- **Developer Velocity:** Minimize boilerplate when defining tables and entities.
- **Type Safety:** Ensure 100% type safety for queries, updates, and schema definitions.
- **Single-Table Design Made Easy:** Provide first-class support for advanced single-table design patterns (key prefixing, static keys, etc.) with minimal configuration.

## Key Features

### Fluent Query Builder
A familiar `db.select()`, `db.update()`, and `db.delete()` API for intuitive data access and modification.

### Relational Query API
A high-level `db.query` API for fetching related entities with nested results, optimized for Single-Table Design performance—fetching collections in a single round-trip.

### Smart Key Management
Automatic UUID generation (v7) and flexible key prefixing strategies to handle complex partition and sort key requirements.

### Migration CLI (`mizzling`)
A dedicated CLI package for managing DynamoDB schema, supporting snapshots, automated migration scripts, and interactive initialization.

## Target Audience

- TypeScript developers building applications on AWS.
- Teams seeking a familiar, fluent API for DynamoDB that mirrors the ergonomics of SQL-based ORMs.
