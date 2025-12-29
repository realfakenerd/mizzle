# Plan: Update Operation Implementation

This plan outlines the steps to implement the `UpdateItem` operation, including the fluent builder, update action support, and integration with existing key resolution strategies.

## Phase 1: Update Builder Foundation [checkpoint: a768f6d]
- [x] Task: Create `src/builders/update.ts` and define the `UpdateBuilder` class. a768f6d
- [x] Task: Implement basic `db.update(entity)` method in `src/utils/db.ts` to return the builder. a768f6d
- [x] Task: Define internal state in `UpdateBuilder` for `SET`, `ADD`, `REMOVE`, and `DELETE` actions. a768f6d
- [x] Task: Implement the `SET` action: a768f6d
    - Write unit tests for `.set()` in `test/builders/update.test.ts`. a768f6d
    - Implement `.set(values)` method with type safety. a768f6d
- [x] Task: Implement Key Resolution: a768f6d
    - Write unit tests for PK/SK resolution from `.where()`. a768f6d
    - Integrate `resolveStrategies` into the builder's internal logic. a768f6d
- [x] Task: Implement basic `execute()`: a768f6d
    - Write unit tests for executing a simple `SET` update. a768f6d
    - Implement `execute()` to construct and send the `UpdateCommand` using the `DynamoDBDocumentClient`. a768f6d
- [x] Task: Conductor - User Manual Verification 'Update Builder Foundation' (Protocol in workflow.md) a768f6d

## Phase 2: Expanded Update Actions & Return Values [checkpoint: 12b906a]
- [x] Task: Implement the `ADD` action: 848eff4
    - Write unit tests for `.add()` (numbers and sets). 848eff4
    - Implement `.add(values)` method. 848eff4
- [x] Task: Implement the `REMOVE` action: 404c493
    - Write unit tests for `.remove()`. 404c493
    - Implement `.remove(...fields)` method. 404c493
- [x] Task: Implement the `DELETE` action: f2a1d15
    - Write unit tests for `.delete()` (set elements). f2a1d15
    - Implement `.delete(values)` method. f2a1d15
- [x] Task: Implement `.returning()` support: fd0c9ed
    - Write unit tests for different `ReturnValues` configurations. fd0c9ed
    - Implement `.returning(value)` and update `execute()` to handle the response. fd0c9ed
- [x] Task: Implement explicit `.key()` support: 3fa7d23
- [x] Task: Conductor - User Manual Verification 'Expanded Update Actions' (Protocol in workflow.md)

## Phase 3: Integration & Cleanup
- [x] Task: Integration Testing: 7190501
    - Create `test/update.integration.test.ts`.
    - Verify full update lifecycle against a local DynamoDB instance.
- [x] Task: Refactor and optimize `UpdateExpression` construction logic. 9ca6350
- [x] Task: Update `src/index.ts` to export necessary types/classes for the new feature. 9ca6350
- [~] Task: Update `README.md` roadmap to mark the Update Operation as complete.
- [ ] Task: Conductor - User Manual Verification 'Final Integration' (Protocol in workflow.md)
