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

## Phase 2: Expanded Update Actions & Return Values
- [x] Task: Implement the `ADD` action: 848eff4
    - Write unit tests for `.add()` (numbers and sets). 848eff4
    - Implement `.add(values)` method. 848eff4
- [ ] Task: Implement the `REMOVE` action:
    - Write unit tests for `.remove()`.
    - Implement `.remove(...fields)` method.
- [ ] Task: Implement the `DELETE` action:
    - Write unit tests for `.delete()` (set elements).
    - Implement `.delete(values)` method.
- [ ] Task: Implement `.returning()` support:
    - Write unit tests for different `ReturnValues` configurations.
    - Implement `.returning(value)` and update `execute()` to handle the response.
- [ ] Task: Implement explicit `.key()` support:
    - Write unit tests for manual key provision.
    - Implement `.key(keyObject)` as an alternative/override to `.where()` resolution.
- [ ] Task: Conductor - User Manual Verification 'Expanded Update Actions' (Protocol in workflow.md)

## Phase 3: Integration & Cleanup
- [ ] Task: Integration Testing:
    - Create `test/update.integration.test.ts`.
    - Verify full update lifecycle against a local DynamoDB instance.
- [ ] Task: Refactor and optimize `UpdateExpression` construction logic.
- [ ] Task: Update `src/index.ts` to export necessary types/classes for the new feature.
- [ ] Task: Update `README.md` roadmap to mark the Update Operation as complete.
- [ ] Task: Conductor - User Manual Verification 'Final Integration' (Protocol in workflow.md)
