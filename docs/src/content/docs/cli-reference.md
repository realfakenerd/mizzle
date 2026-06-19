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

The CLI relies on `mizzle.config.ts` (or `mizzle.config.js`) to find your schema definitions and connect to DynamoDB.

```typescript
// mizzle.config.ts
import { defineConfig } from "@aurios/mizzling";

export default defineConfig({
  // Path or glob pattern(s) to schema files
  schema: "./src/db/schema.ts",
  // Directory where generated migrations and snapshots are stored
  out: "./migrations",
  // AWS configuration
  region: "us-east-1",
  endpoint: "http://localhost:8000", // Optional: for local development
  profile: "default", // Optional: AWS profile name
  
  // Explicit credentials (optional, prioritised over profile/default providers)
  credentials: {
    accessKeyId: "...",
    secretAccessKey: "...",
  },
  
  maxAttempts: 3, // Optional: DynamoDB retry limit
  verbose: false, // Optional: print executed commands and times
  strict: true,   // Optional: require confirmation prompts before push
});
```

### Environment Overrides

Any configuration properties defined in the config file can be overridden by environment variables:

- `MIZZLE_CONFIG`: Overrides the default config file path.
- `MIZZLE_SCHEMA`: Overrides the schema path.
- `MIZZLE_OUT`: Overrides the output migrations folder.
- `MIZZLE_REGION`: Overrides the AWS region.
- `MIZZLE_ENDPOINT`: Overrides the DynamoDB endpoint.
- `MIZZLE_VERBOSE`: Overrides the verbose setting (`"true"` / `"false"`).
- `MIZZLE_STRICT`: Overrides the strict mode (`"true"` / `"false"`).
