# Specification: Delete Feature Implementation

## Overview
This track introduces the `delete` operation to Mizzle, providing a lightweight and type-safe way to remove items from DynamoDB. Following the project's vision of a "Drizzle-like" experience, the API will be intuitive and fluent.

## Functional Requirements
- **Delete Operation:** Implement a `delete` method on the main `DynamoDB` class.
- **Fluent API with Initial Key:** The API will support an initial call with keys, followed by an optional fluent builder: `db.delete(entity, { id: "123" }).returning().execute()`.
- **Primary Key Enforcement:** The `delete` operation will strictly operate on the primary key (Partition Key and Sort Key) of the target entity.
- **Return Attributes Support:** Support returning the attributes of the deleted item using the `.returning()` method, leveraging DynamoDB's `ReturnValues: 'ALL_OLD'`.
- **Type Safety:** Ensure the keys provided in the initial call are type-checked against the entity's schema.

## Non-Functional Requirements
- **Minimal Overhead:** Maintain high performance by directly translating the call to the AWS SDK's `DeleteCommand`.
- **Consistent Ergonomics:** The API structure should feel familiar to users of `db.select()` and `db.update()`.

## Acceptance Criteria
- [ ] Users can delete an item by providing its primary key.
- [ ] Users can optionally receive the deleted item's attributes using `.returning()`.
- [ ] Type errors are raised if the provided keys do not match the entity's schema.
- [ ] All new code is covered by unit and integration tests (>80% coverage).
- [ ] Existing functionality remains unaffected (regression testing).

## Out of Scope
- Support for complex `where()` clauses that require `scan` or `query` before deletion.
- Batch delete operations (to be handled in a separate track).
