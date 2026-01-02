# Plan: TypeScript Error Remediation (Source Code) [checkpoint: a934e42]

## Phase 1: Core Type Foundations [checkpoint: a934e42]
Fix fundamental type definitions in the core module that propagate errors to the builders.

- [x] Task: Fix `src/core/table.ts` - Resolve symbol assignment and interface mismatch errors.
- [x] Task: Fix `src/core/column-builder.ts` - Address property commonality errors in `AnyTable`.
- [x] Task: Fix `src/core/strategies.ts` - Resolve potentially undefined properties and symbol indexing issues.
- [x] Task: Conductor - User Manual Verification 'Core Type Foundations' (Protocol in workflow.md)

## Phase 2: Basic Builders
Address errors in the primary data manipulation builders.

- [x] Task: Fix `src/builders/insert.ts` - Resolve `Object.entries` type mismatches and missing property errors on `KeyStrategy`.
- [x] Task: Fix `src/builders/select.ts` - Fix symbol indexing and undefined object access.
- [~] Task: Conductor - User Manual Verification 'Basic Builders' (Protocol in workflow.md)

## Phase 3: Advanced Builders & Relational
Fix errors in complex query and update builders.

- [ ] Task: Fix `src/builders/query-builder.ts` - Resolve missing exports, type assertions for columns, and index signature errors.
- [ ] Task: Fix `src/builders/relational-builder.ts` - Resolve missing member exports from operators.
- [ ] Task: Fix `src/builders/update-builder.ts` - Fix missing type definitions (`TableDefinition`, `AtomicValues`) and primary key detection logic.
- [ ] Task: Conductor - User Manual Verification 'Advanced Builders & Relational' (Protocol in workflow.md)

## Phase 4: Final Verification
Ensure the entire source tree is clean and no regressions were introduced.

- [ ] Task: Final Type Check - Run `bun run check` and ensure zero errors in `src/`.
- [ ] Task: Regression Test - Run `bun test` and ensure all existing tests pass.
- [ ] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md)
