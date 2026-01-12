# Track Specification: Date / Timestamp (date) Column Type

## Overview
This track adds a native `date()` column type to the Mizzle ORM. Since DynamoDB lacks a dedicated date type, this feature provides developer ergonomics by automatically handling the conversion between JavaScript `Date` objects (or compatible inputs) and a standardized storage format (ISO 8601 strings in UTC) in the database.

## Functional Requirements
- **Standardized Storage:** All dates will be stored as ISO 8601 strings in UTC (e.g., `2023-10-27T10:00:00.000Z`).
- **Flexible Input Mapping:** The column builder should accept `Date` objects, ISO strings, or Unix timestamps (numbers) as input for write operations.
- **Consistent Output Mapping:** Reading from this column will always return a native JavaScript `Date` object.
- **Automatic Timestamps:** 
    - Built-in support for `createdAt` behavior (setting the current timestamp on item creation).
    - Built-in support for `updatedAt` behavior (setting the current timestamp whenever the item is modified).
- **Reserved Word Safety:** Ensure that date-related column names (often reserved in DynamoDB) are correctly handled by the internal Expression Builder.

## Non-Functional Requirements
- **Sortability:** Storing as ISO 8601 UTC strings ensures that sort keys using dates behave correctly (alphabetical sort matches chronological sort).
- **Type Safety:** 100% type safety for inputs (Date | string | number) and outputs (Date).

## Acceptance Criteria
- [ ] A new `date()` function is exported from `mizzle/columns`.
- [ ] The `date()` column correctly serializes `Date`, `string`, and `number` inputs into ISO 8601 UTC strings.
- [ ] The `date()` column correctly deserializes stored strings back into `Date` objects.
- [ ] Using `.defaultNow()` (or similar) on a `date()` column sets the current time on `put` operations if the value is missing.
- [ ] Using `.onUpdateNow()` (or similar) automatically injects the current time on `update` operations.
- [ ] Integration tests verify that sort keys using `date()` columns sort correctly in DynamoDB.

## Out of Scope
- Support for Unix Timestamp (Number) as the *storage* format (deferred to future track if requested).
- Custom formatting strings (only standard ISO 8601 is supported).
