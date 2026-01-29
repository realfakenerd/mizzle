# 🌧️ Mizzling CLI

Mizzling is the official command-line interface for the Mizzle ORM, designed to manage DynamoDB migrations and schemas with ease. It provides a streamlined workflow for initializing projects, detecting schema changes, and applying them to your AWS environment.

You can skip this and see a better documentation [here](https://mizzle-docs.vercel.app)

## 🚀 Installation

You can install the CLI as a development dependency in your project using your preferred package manager, so let's get started:

```bash
npm install @aurios/mizzling
# or
bun add @aurios/mizzling
```

## 🛠️ Commands

The CLI offers several commands to manage your DynamoDB infrastructure:

1. `bunx mizzling init`: Initializes a new Mizzle configuration in your current directory. This is an interactive command that guides you through:

- Setting the path to your schema files.
- Defining the output directory for migrations and snapshots.
- Configuring the AWS region and optional custom endpoints (e.g., for local development with DynamoDB Local or LocalStack).

It generates a mizzle.config.ts file upon completion.

2. `bunx mizzling generate [--name <name>]`: Analyzes your current schema and compares it against the last saved snapshot to generate a new migration script.

It automatically detects created, deleted, or updated tables.

Creates a TypeScript migration file with up and down functions for version control.

3. `bunx mizzling push [-y, --yes]`: Directly applies schema changes to your target DynamoDB environment without generating migration files.

The `--yes` flag skips the interactive confirmation prompt. Useful for rapid prototyping and synchronizing development environments.

4. `bunx mizzling list`: Provides a summary of all existing DynamoDB tables in the configured environment.

For each table, it displays:

- The table name.
- Primary Key (PK) and Sort Key (SK) attributes.
- A list of Global Secondary Indexes (GSIs).

5. `bunx mizzling drop`: An interactive tool to safely remove tables from your environment.

It fetches a list of remote tables and allows you to select multiple items for deletion.

> Warning: This action is irreversible and requires explicit
> confirmation before proceeding.

## ⚙️ Configuration (mizzle.config.ts)

Mizzling uses a central configuration file. You can use the defineConfig helper for full TypeScript type safety:
TypeScript

```ts
import { defineConfig } from "@aurios/mizzling";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  region: "us-east-1",
  // endpoint: "http://localhost:8000", // Optional for local dev
});
```

## Environment Overrides

Configuration values can be overridden using environment variables:

- MIZZLE_REGION: Overrides the AWS region.
- MIZZLE_ENDPOINT: Overrides the DynamoDB endpoint.
- MIZZLE_SCHEMA: Overrides the schema path.
- MIZZLE_OUT: Overrides the migrations output directory.

## 📄 License

This project is licensed under the MIT License.
