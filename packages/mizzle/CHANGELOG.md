# mizzle

## 2.0.0

### Major Changes

- 5dd0c9f: rename packages to @aurios scope

### Patch Changes

- 114efb9: Completed 100% JSDoc/TSDoc coverage for all public APIs and improved internal type safety.

  - **@aurios/mizzle**: Added comprehensive documentation to Query Builders, Schema Definitions, and the main entry point. Resolved numerous linting issues by replacing `any` with safer alternatives.
  - **@aurios/mizzling**: Fixed CLI entry point in E2E and integration tests, ensuring CI stability.
  - **@mizzle/shared**: Enhanced utility type safety.
  - **Infrastructure**: Updated Turbo configuration to handle new environment variables.

## 1.0.1

### Patch Changes

- fix: resolve schema discovery issues in monorepos and stabilize test suite.

## 1.0.0

### Major Changes

- Initial production release of Mizzle ORM and Mizzling CLI.
  Includes:
  - Fluent Query Builder (Select, Insert, Update, Delete)
  - Native Date Support with ISO 8601 storage
  - Relational Queries with Single-Table optimization
  - Atomic Transactions support
  - Migration CLI with schema discovery and push/pull
  - High-performance tsup-based bundling
