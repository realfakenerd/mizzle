# Spec: Stabilize Core ORM Operations

## Overview
This track focuses on ensuring the reliability and robustness of Mizzle's fundamental ORM operations: `insert` and `select`. As a brownfield project, Mizzle already has implementations for these, but they need to be rigorously tested and refined to handle various DynamoDB single-table design scenarios.

## Goals
- Ensure `insert` correctly handles all supported column types and key strategies (prefix, uuid, etc.).
- Ensure `select` (querying/scanning) correctly translates Mizzle's fluent API into valid DynamoDB expressions.
- Validate that type safety is preserved from the entity definition through to the result set.

## Functional Requirements
- **Insert Command:**
  - Validate support for `string`, `number`, `uuid`, `boolean`, `list`, `map`, and `set` types.
  - Correctly apply partition and sort key strategies (e.g., prefixing).
  - Handle auto-generated fields (like UUID v7).
- **Select Command:**
  - Support basic equality filters on keys.
  - Support a range of operators (e.g., `beginsWith`, `between`, `>=`, etc.) if already partially implemented.
  - Ensure correct mapping of attribute names to avoid DynamoDB reserved word conflicts.

## Technical Requirements
- Minimum 80% test coverage for the `commands/insert.ts` and `commands/select.ts` files.
- Tests must use `vitest` and, if possible, interact with a local DynamoDB instance (provided via docker-compose).
