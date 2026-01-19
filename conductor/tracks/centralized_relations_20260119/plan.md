# Plan: Centralized Relational Definition API

## Phase 1: Type Design & Core implementation [checkpoint: 565d0acfc365abf8]
- [x] Task: Define the new `defineRelations` type signature in `packages/mizzle/src/core/relations.ts`
    - [x] Implement `RelationalHelper` types for `r.one.<entity>`, `r.many.<entity>`, and `r.<entity>.<column>`
    - [x] Update `defineRelations` function signature
- [x] Task: Implement runtime logic for the new API
    - [x] Update `defineRelations` implementation to build the helper object and collect results
    - [x] Ensure internal symbol marking remains for `extractMetadata`
- [x] Task: Conductor - User Manual Verification 'API & Types' (Protocol in workflow.md)

## Phase 2: Metadata Extraction & Integration [checkpoint: 565d0acfc365abf8]
- [x] Task: Update `extractMetadata` in `packages/mizzle/src/core/relations.ts`
    - [x] Handle the new centralized structure where multiple entities are defined in one object
    - [x] Maintain compatibility with legacy per-entity definitions if necessary (or decide to deprecate)
- [x] Task: Update `mizzle` initialization logic
    - [x] Ensure `mizzle({ relations })` correctly extracts metadata from the new format
- [x] Task: Conductor - User Manual Verification 'Metadata & Integration' (Protocol in workflow.md)

## Phase 3: Verification & Migration [checkpoint: 565d0acfc365abf8]
- [x] Task: Update existing relational tests
    - [x] Migrate `test/relational-definition.test.ts` to the new syntax
    - [x] Migrate `test/builders/relational.integration.test.ts`
- [x] Task: Add new tests for complex scenarios
    - [x] Test deeply nested relations in `test/relational-centralized.test.ts`
    - [x] Test relations using the new helper column references (`r.entity.column`)
- [x] Task: Conductor - User Manual Verification 'Full Verification' (Protocol in workflow.md)
