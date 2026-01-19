# Plan: Comprehensive JSDoc Documentation

## Phase 1: Core Query Builders
- [x] Task: Add JSDocs to `SelectBuilder` and its methods [445d7f5]
    - [ ] Create verification tests for `db.select()` JSDoc presence and content (simulated via type checks/manual inspection)
    - [ ] Add JSDocs to `select`, `where`, `limit`, `offset`, `orderBy`, and `execute` methods in `packages/mizzle/src/builders/select.ts`
- [ ] Task: Add JSDocs to `InsertBuilder` and its methods
    - [ ] Add JSDocs to `insert`, `values`, and `execute` methods in `packages/mizzle/src/builders/insert.ts`
- [ ] Task: Add JSDocs to `UpdateBuilder` and its methods
    - [ ] Add JSDocs to `update`, `set`, `where`, and `execute` methods in `packages/mizzle/src/builders/update.ts`
- [ ] Task: Add JSDocs to `DeleteBuilder` and its methods
    - [ ] Add JSDocs to `delete`, `where`, and `execute` methods in `packages/mizzle/src/builders/delete.ts`
- [ ] Task: Conductor - User Manual Verification 'Core Query Builders' (Protocol in workflow.md)

## Phase 2: Schema Definition API
- [ ] Task: Add JSDocs to `defineTable` and `dynamoEntity`
    - [ ] Add comprehensive JSDocs with examples to `packages/mizzle/src/core/table.ts`
- [ ] Task: Add JSDocs to Column Builders
    - [ ] Add JSDocs to `string`, `number`, `boolean`, `date`, `uuid`, `json`, etc., in `packages/mizzle/src/columns/`
- [ ] Task: Add JSDocs to `defineRelations`
    - [ ] Add JSDocs with 1:N and 1:1 examples to `packages/mizzle/src/core/relations.ts`
- [ ] Task: Conductor - User Manual Verification 'Schema Definition API' (Protocol in workflow.md)

## Phase 3: Initialization & Utilities
- [ ] Task: Add JSDocs to `mizzle()` constructor
    - [ ] Add JSDocs to the main entry point in `packages/mizzle/src/db.ts`
- [ ] Task: Add JSDocs to `defineConfig` (Mizzling)
    - [ ] Add JSDocs to `defineConfig` in `packages/mizzling/src/config.ts`
- [ ] Task: Conductor - User Manual Verification 'Initialization & Utilities' (Protocol in workflow.md)
