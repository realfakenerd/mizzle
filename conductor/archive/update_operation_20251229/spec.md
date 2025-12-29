# Spec: Update Operation

## Overview
This track implements the `UpdateItem` operation for Mizzle, providing a fluent, Drizzle-like builder. This allows users to modify existing items in DynamoDB with type safety and automatic key resolution based on defined strategies.

## Goals
- Provide a fluent `db.update(entity)` API.
- Support `SET`, `ADD`, `REMOVE`, and `DELETE` update actions.
- Implement intelligent key resolution from `.where()` clauses or explicit `.key()` calls.
- Support configurable return values via `.returning()`.

## Functional Requirements
- **Fluent Builder:**
    - `db.update(entity)` initializes the builder.
    - `.set(values)`: Updates or adds attributes (DynamoDB `SET`).
    - `.add(values)`: Increments/decrements numbers or adds to sets (DynamoDB `ADD`).
    - `.remove(...fields)`: Deletes specific attributes (DynamoDB `REMOVE`).
    - `.delete(values)`: Removes elements from a set (DynamoDB `DELETE`).
    - `.where(expression)`: Defines the condition to identify the item and optionally provides condition expressions.
    - `.key(keyObject)`: Explicitly provide the primary key if it cannot be resolved from `.where()`.
    - `.returning(value)`: Configures `ReturnValues` (e.g., `'ALL_NEW'`, `'UPDATED_NEW'`, `'ALL_OLD'`, `'UPDATED_OLD'`).
- **Key Resolution:** Leverage existing `resolveStrategies` to extract the Partition Key and Sort Key from the `.where()` clause.
- **Type Safety:**
    - `.set()` and `.add()` should be type-safe based on the entity's column definitions.
    - `.remove()` should only allow existing column names.

## Acceptance Criteria
- Users can update an item using a fluent syntax: `db.update(user).set({ age: 31 }).where(eq(user.id, '123')).execute()`.
- All four update actions (`SET`, `ADD`, `REMOVE`, `DELETE`) generate the correct `UpdateExpression`.
- PK and SK are correctly resolved from the `where` clause using the entity's key strategies.
- The `.returning()` method correctly influences the result of the `execute()` call.
- Comprehensive unit and integration tests verify all update actions and key resolution scenarios.

## Out of Scope
- `TransactWriteItems` (planned for a separate track).
- Conditional updates (`ConditionExpression` beyond key resolution) - though basic support might be implicit if `.where` is used for both key resolution and condition.
