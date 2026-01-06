---
title: CLI Reference
description: Guide for the mizzle CLI tool.
---

The `mizzling` package provides a command-line interface (CLI) for managing your DynamoDB schema, handling migrations, and interacting with your environment.

## Installation

```bash
bun add -d mizzling
```

You can then run it using `bun x mizzle`.

## Commands

### `init`

Initializes the Mizzle configuration in your project. It creates a `mizzle.config.ts` file.

```bash
bun x mizzle init
```

### `generate`

Analyzes your entity definitions and generates a new migration snapshot and script.

```bash
bun x mizzle generate --name <migration_name>
```

- **Options:**
  - `-n, --name <name>`: Provide a descriptive name for the migration.

### `push`

Directly applies schema changes to the target DynamoDB environment. This command compares your local schema definitions with the actual state of the DynamoDB tables and applies the necessary `CreateTable` or `UpdateTable` operations.

```bash
bun x mizzle push
```

- **Options:**
  - `-y, --yes`: Skip the confirmation prompt before applying changes.

### `list`

Lists all existing DynamoDB tables in your configured environment.

```bash
bun x mizzle list
```

### `drop`

An interactive command that allows you to select and delete DynamoDB tables from your environment. **Use with extreme caution.**

```bash
bun x mizzle drop
```

## Configuration

The CLI relies on `mizzle.config.ts` to find your schema definitions and connect to DynamoDB.

```typescript
// mizzle.config.ts
import { defineConfig } from "mizzling";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "aws-sdk",
  dbCredentials: {
    region: "us-east-1",
  },
});
```
