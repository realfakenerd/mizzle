# Specification: Monorepo Transformation with Turborepo

## Overview
Transform Mizzle into a modular monorepo using Turborepo. This restructure separates the core library (`mizzle`), the CLI tool (`mizzling`), and shared logic into distinct packages, enabling subpath imports and implementing build/test caching.

## Goals
- **Package Separation:**
    - `packages/mizzle`: The core library for schema definition and querying.
    - `packages/mizzling`: The dedicated CLI package.
    - `packages/shared`: Common utilities, constants, and types used by both.
- **Improved Import DX:** Support subpath imports for the library like `mizzle/columns` and `mizzle/table`.
- **Dedicated CLI:** Users will use `mizzling` for CLI operations.
- **Performance:** Implement build/test caching using Turborepo.
- **Maintainability:** Keep tests centralized in the root `test/` directory.

## Functional Requirements
- **Monorepo Structure:**
    - `packages/mizzle`: Core ORM logic.
    - `packages/mizzling`: CLI commands and logic.
    - `packages/shared`: Shared utility functions, types, and constants.
    - `packages/eslint-config`: Shared ESLint rules.
    - `packages/tsconfig`: Shared TypeScript base configurations.
- **Subpath Exports:** Configure `packages/mizzle/package.json` with `exports` to allow:
    - `import { ... } from "mizzle/columns"`
    - `import { ... } from "mizzle/table"`
- **CLI Command:** Configure `packages/mizzling` to provide the `mizzling` binary.
- **Workspace Management:** Use Bun workspaces and Turborepo.
- **Centralized Testing:** Preserve root `test/` directory, testing all modular packages.

## Acceptance Criteria
- [ ] Repository structure reflects the defined package layout.
- [ ] `turbo run build`, `turbo run test`, and `turbo run lint` execute correctly.
- [ ] `packages/mizzling` and `packages/mizzle` successfully import from `packages/shared`.
- [ ] A project can install `mizzle` and use `import { ... } from "mizzle/columns"`.
- [ ] A project can run `mizzling` to manage migrations.
- [ ] Turborepo caching is functional (verified by "cache hit").

## Out of Scope
- Adding new ORM features.
- Publishing to NPM (future track).
