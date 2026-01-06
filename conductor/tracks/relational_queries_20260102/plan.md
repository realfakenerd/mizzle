# Plan: Relational Query API Implementation

## Phase 1: Core Architecture & Schema Types [checkpoint: 49e2f2e]
Establish the foundation for the relational schema and the new initialization logic.

- [x] Task: Update `mizzle` entry point in `src/utils/db.ts` to support `mizzle({ client, relations })`. 3e502d1
- [x] Task: Implement `defineRelations` utility in `src/core/relations.ts`. c374176
- [x] Task: Define internal metadata structures for mapping entities to relations. 26b3280
- [x] Task: Create basic types for the `RelationalQueryBuilder` and query options (`where`, `with`, `include`). d7044ef
- [x] Task: Conductor - User Manual Verification 'Core Architecture & Schema Types' (Protocol in workflow.md)

## Phase 2: The Query Proxy & FindMany (TDD) [checkpoint: 8fc0c92]
Implement the high-level API access and basic query execution.

- [x] Task: Implement the `db.query` proxy to provide dynamic access to entities in the schema. 4f3a5c3
- [x] Task: Implement `RelationalQueryBuilder.findMany()` base logic. 5b91de5
- [x] Task: Write failing tests in `test/builders/relational.test.ts` for basic `findMany` without relations. 5b91de5
- [x] Task: Implement logic to translate `where` conditions inside `findMany` to DynamoDB expressions. 4599ad0
- [x] Task: Conductor - User Manual Verification 'The Query Proxy & FindMany' (Protocol in workflow.md)

## Phase 3: Single-Table Mapping & Item Parsing (TDD) [checkpoint: ad8f859]
Implement the core optimization for Single-Table Design.

- [x] Task: Implement `ItemCollectionParser` to group raw DynamoDB items into structured objects based on relation metadata. 371cafb
- [x] Task: Write failing integration tests in `test/builders/relational.integration.test.ts` for 1:N relations in a single table. 65720db
- [x] Task: Update `RelationalQueryBuilder` to fetch related items sharing a PK in a single `Query` command. 24c5d3d
- [x] Task: Implement support for both `with` and `include` keywords in selection options. 3de5eac
- [x] Task: Conductor - User Manual Verification 'Single-Table Mapping & Item Parsing' (Protocol in workflow.md)

## Phase 4: Advanced Relations (1:1, N:M, GSI)
Extend the API to support complex relational patterns.

- [x] Task: Implement support for 1:1 relations and correctly picking the single related item. 3199e81
- [ ] Task: Implement Many-to-Many (N:M) resolution via bridge entities/GSI.
- [ ] Task: Implement GSI-based relations (where the link exists on a GSI).
- [ ] Task: Implement `findFirst()` with appropriate limits and parsing.
- [ ] Task: Conductor - User Manual Verification 'Advanced Relations' (Protocol in workflow.md)

## Phase 5: Final Verification & Type Safety
Ensure the entire implementation is robust and follows the "Drizzle/Prisma" ergonomics.

- [ ] Task: Run `bun run check` to verify deep type safety for nested `include` calls.
- [ ] Task: Run full test suite `bun run test` to ensure no regressions in existing CRUD operations.
- [ ] Task: Conductor - User Manual Verification 'Final Verification & Type Safety' (Protocol in workflow.md)
