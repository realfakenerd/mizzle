# Implementation Plan: Relational Queries (Adjacency List Pattern)

Implementing a type-safe relational query API (`db.query`) supporting one-to-many, many-to-one, and adjacency list patterns.

## Phase 1: Relationship Metadata & Helpers
Define the DSL for specifying relationships between entities.

- [ ] Task 1: Implement `one` and `many` relation helpers in `src/relations.ts`.
- [ ] Task 2: Implement the `relations` function to aggregate entity relationships.
- [ ] Task 3: Create unit tests to verify relation metadata generation.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Relationship Metadata & Helpers' (Protocol in workflow.md)

## Phase 2: Client Initialization & Query Proxy
Update the Mizzle client to ingest relations and provide the dynamic `db.query` interface.

- [ ] Task 1: Update `mizzle` and `DynamoDB` class to accept the `relations` configuration.
- [ ] Task 2: Implement a Proxy-based `query` property on the `DynamoDB` class to allow `db.query.<entityName>`.
- [ ] Task 3: Write tests ensuring `db.query` correctly resolves the target entity and its relations.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Client Initialization & Query Proxy' (Protocol in workflow.md)

## Phase 3: Relational Query Builder & Type Inference
Develop the query builder that handles the `with` operator and nested result types.

- [ ] Task 1: Refactor `RelationnalQueryBuilder` to support the `with` option in `findMany` and `findFirst`.
- [ ] Task 2: Implement TypeScript utility types for deep result inference (including nested objects/arrays).
- [ ] Task 3: Write tests for the `with` syntax and type-checking verification.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Relational Query Builder & Type Inference' (Protocol in workflow.md)

## Phase 4: Adjacency List Execution Logic
Implement the logic to translate relational queries into optimized DynamoDB operations.

- [ ] Task 1: Implement GSI resolution logic to identify the best index for a combined parent-child query.
- [ ] Task 2: Implement result transformation: convert the flat list of DynamoDB items into a nested hierarchy.
- [ ] Task 3: Implement "Belongs-To" (many-to-one) resolution logic.
- [ ] Task 4: Write integration tests using the Adjacency List pattern (PK=USER#1, SK=USER#1 for parent; SK=POST#1 for children).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Adjacency List Execution Logic' (Protocol in workflow.md)

## Phase 5: Final Integration & Many-to-Many
Finalize support for many-to-many relationships and complete the end-to-end integration.

- [ ] Task 1: Implement Many-to-Many support via bridge entities/adjacency list.
- [ ] Task 2: Conduct comprehensive integration tests covering complex nested queries.
- [ ] Task 3: Ensure code coverage >80% and all quality gates pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Final Integration & Many-to-Many' (Protocol in workflow.md)
