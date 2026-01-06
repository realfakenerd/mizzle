# Plan: Monorepo Transformation with Turborepo

## Phase 1: Foundation & Scaffolding [checkpoint: 24e9c21]
Set up the monorepo structure, workspace configuration, and shared base configurations.

- [x] Task: Initialize Bun Workspaces and Turborepo configuration (`turbo.json`) de43096
- [x] Task: Create and configure `packages/tsconfig` for shared TypeScript settings bce88b1
- [x] Task: Create and configure `packages/eslint-config` for shared linting rules 8d0fd2c
- [x] Task: Conductor - User Manual Verification 'Foundation & Scaffolding' (Protocol in workflow.md) b744727

## Phase 2: Shared Package Extraction [checkpoint: 9b93400]
Extract common utilities and constants into a dedicated package to be used by both the library and CLI.

- [x] Task: Create `packages/shared` and migrate code from `src/utils` and `src/constants` f8d2aa6
- [x] Task: Update internal imports in `src/` to use `@mizzle/shared` 050aaa4
- [x] Task: Conductor - User Manual Verification 'Shared Package Extraction' (Protocol in workflow.md) 9b93400

## Phase 3: Core Library Modularization (`mizzle`)
Isolate the core ORM logic and configure it for modern subpath imports.

- [~] Task: Move core logic (builders, columns, expressions, core) to `packages/mizzle`
- [ ] Task: Configure subpath `exports` in `packages/mizzle/package.json`
- [ ] Task: Update root tests to import from the new `mizzle` package locations
- [ ] Task: Conductor - User Manual Verification 'Core Library Modularization' (Protocol in workflow.md)

## Phase 4: CLI Modularization (`mizzling`)
Separate the CLI tool into its own package and rename the binary to `mizzling`.

- [ ] Task: Move CLI code to `packages/mizzling` and configure the `mizzling` binary
- [ ] Task: Update `packages/mizzling` to depend on `packages/mizzle` and `packages/shared`
- [ ] Task: Update E2E and CLI tests to use the `mizzling` command
- [ ] Task: Conductor - User Manual Verification 'CLI Modularization' (Protocol in workflow.md)

## Phase 5: Task Orchestration & Caching
Finalize the Turborepo pipeline and verify performance optimizations.

- [ ] Task: Define `turbo.json` pipelines for `build`, `test`, `lint`, and `check`
- [ ] Task: Verify build and test caching across the monorepo
- [ ] Task: Conductor - User Manual Verification 'Task Orchestration & Caching' (Protocol in workflow.md)
