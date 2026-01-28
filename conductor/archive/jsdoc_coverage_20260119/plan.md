# Plan: Comprehensive JSDoc Documentation

## Phase 1: Core Query Builders [checkpoint: 6252b4c]

- [x] Task: Add JSDocs to `SelectBuilder` and its methods [445d7f5]
  - [x] Create verification tests for `db.select()` JSDoc presence and content (simulated via type checks/manual inspection)
  - [x] Add JSDocs to `select`, `where`, `limit`, `offset`, `orderBy`, and `execute` methods in `packages/mizzle/src/builders/select.ts`
- [x] Task: Add JSDocs to `InsertBuilder` and its methods [c3055fc]
  - [x] Add JSDocs to `insert`, `values`, and `execute` methods in `packages/mizzle/src/builders/insert.ts`
- [x] Task: Add JSDocs to `UpdateBuilder` and its methods [c3055fc]
  - [x] Add JSDocs to `update`, `set`, `where`, and `execute` methods in `packages/mizzle/src/builders/update.ts`
- [x] Task: Add JSDocs to `DeleteBuilder` and its methods [c3055fc]
  - [x] Add JSDocs to `delete`, `where`, and `execute` methods in `packages/mizzle/src/builders/delete.ts`
- [x] Task: Conductor - User Manual Verification 'Core Query Builders' (Protocol in workflow.md)

## Phase 2: Schema Definition API [checkpoint: 254eef6]

- [x] Task: Add JSDocs to `defineTable` and `dynamoEntity` [79a00ec]
  - [x] Add comprehensive JSDocs with examples to `packages/mizzle/src/core/table.ts`
- [x] Task: Add JSDocs to Column Builders [79a00ec]
  - [x] Add JSDocs to `string`, `number`, `boolean`, `date`, `uuid`, `json`, etc., in `packages/mizzle/src/columns/`
- [x] Task: Add JSDocs to `defineRelations` [640eb7c]
  - [x] Add JSDocs with 1:N and 1:1 examples to `packages/mizzle/src/core/relations.ts`
- [x] Task: Conductor - User Manual Verification 'Schema Definition API' (Protocol in workflow.md)

## Phase 3: Initialization & Utilities [checkpoint: 33ed4e8]

- [x] Task: Add JSDocs to `mizzle()` constructor [aec806a]
  - [x] Add JSDocs to the main entry point in `packages/mizzle/src/db.ts`
- [x] Task: Add JSDocs to `defineConfig` (Mizzling) [aec806a]
  - [x] Add JSDocs to `defineConfig` in `packages/mizzling/src/config.ts`
- [x] Task: Conductor - User Manual Verification 'Initialization & Utilities' (Protocol in workflow.md)
