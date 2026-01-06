# Specification: Mizzle Migration CLI

## Overview
The Mizzle Migration CLI is a companion tool for the Mizzle ORM designed to manage DynamoDB table infrastructure. It allows developers to define their schema in TypeScript and use the CLI to generate, push, and inspect their DynamoDB tables, GSIs, and LSIs.

## Functional Requirements

### 1. Configuration (`mizzle.config.ts`)
- The CLI will look for a `mizzle.config.ts` file in the project root.
- The config file will define the schema location (files or directories) and the migration output directory.

### 2. Commands
- **`generate`**:
    - Scans defined schema files for Mizzle table definitions.
    - Compares current schema with the latest JSON snapshot in the migrations folder.
    - Generates a new JSON snapshot and a versioned TypeScript migration script (e.g., `0000_create_users.ts`) if changes are detected.
- **`push`**:
    - Directly applies schema changes to the target DynamoDB environment (local or AWS).
    - Useful for rapid development cycles where full migration history isn't required for every small tweak.
- **`list`**:
    - Queries the AWS environment to list all existing DynamoDB tables.
    - Displays details for each table, including Partition Key, Sort Key, GSIs, and LSIs.
- **`drop`**:
    - An interactive command to select and delete DynamoDB tables from the environment.

### 3. State Management (Hybrid Approach)
- **Snapshots**: JSON files stored in the migrations directory that represent the "last known good state" of the schema.
- **Scripts**: Executable TypeScript migration scripts that contain the logic to transform the database state.

### 4. User Interface
- Built using **Clack** for an interactive, modern CLI experience.
- Provides clear progress indicators, success messages, and error handling with helpful suggestions.

## Non-Functional Requirements
- **Type Safety**: The CLI itself should be written in TypeScript.
- **Performance**: Schema scanning and diffing should be near-instant.
- **Minimal Dependencies**: Leverage Bun's speed and the existing AWS SDK.

## Acceptance Criteria
- [ ] Users can initialize a `mizzle.config.ts`.
- [ ] The `generate` command successfully detects new tables/indexes and creates snapshot + script files.
- [ ] The `push` command updates a local DynamoDB (e.g., LocalStack or DynamoDB Local) to match the schema.
- [ ] The `list` command accurately displays remote tables.
- [ ] The `drop` command provides a safe, interactive way to delete tables.

## Out of Scope
- Support for databases other than DynamoDB.
- Advanced "rollback" logic for migration scripts in this initial version.
