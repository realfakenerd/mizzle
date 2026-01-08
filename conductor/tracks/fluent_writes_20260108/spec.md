# Specification: Fluent Writes - Expression Builder & Safety

## Overview
Writing raw DynamoDB `UpdateExpression` strings is error-prone and requires manual management of `ExpressionAttributeNames` and `ExpressionAttributeValues`. This track introduces a high-level Expression Builder that allows developers to perform complex updates using a simple object-based API, while automatically ensuring safety against reserved words.

## Functional Requirements

### 1. Automatic Reserved Word Safety
- The builder MUST automatically use `ExpressionAttributeNames` (e.g., `#status`) for *every* attribute in the update.
- This prevents execution failures when users have column names that match DynamoDB reserved words (e.g., "name", "value", "order").

### 2. Flat Object Update API
- Implement a builder that accepts a flat object representing the desired state.
- **Example:** `db.update(users).set({ status: 'active', loginCount: add(1) }).where(...)`
- The builder is responsible for partitioning this object into the correct DynamoDB sections: `SET`, `ADD`, `REMOVE`, and `DELETE`.

### 3. Atomic & Functional Helpers
- Provide standalone, tree-shakable helper functions for advanced operations:
  - `add(value)`: Maps to the `ADD` section for numbers.
  - `append(list, value)`: Maps to `list_append`.
  - `ifNotExists(path, value)`: Maps to `if_not_exists(path, value)`.
  - `remove()`: Maps to the `REMOVE` section.
  - `addToSet(values)`: Maps to `ADD` for Sets.
  - `deleteFromSet(values)`: Maps to `DELETE` for Sets.

### 4. Automatic Value Mapping
- Automatically generate `ExpressionAttributeValues` (e.g., `:val1`) for every value provided in the object, including those nested in helpers.

## Non-Functional Requirements
- **Type Safety:** The update object should be partially typed based on the Entity/Table definition, ensuring that `add(1)` can only be used on numeric columns, etc.
- **Efficiency:** Minimize the number of unique attribute names/values generated to keep the request payload small.

## Acceptance Criteria
- [ ] `db.update(Entity).set({ name: 'Luke' })` generates `SET #name = :v1` and populates the attribute maps.
- [ ] Using `add(1)` on a numeric column correctly generates an `ADD` section in the expression.
- [ ] `list_append` logic works via the `append()` helper and produces a valid `SET` expression.
- [ ] Multiple operations in a single `.set()` call (e.g., a `SET` and an `ADD`) are correctly combined into one `UpdateExpression`.
- [ ] Reserved words like `name`, `status`, `type` do not cause errors.

## Out of Scope
- Support for `UpdateItem` on Primary Keys (DynamoDB limitation).
- Condition expressions (`ConditionExpression`) are handled by a separate track or existing `.where()` logic, though the builder should be compatible.
