# Plan: Drizzle-aligned Configuration (`defineConfig`)

## Phase 1: Project Structure Update [checkpoint: 4ea0438]

- [x] Task: Update `tsup.config.ts` to support dual entry points (CLI and Library)
  - [x] Modify `tsup.config.ts` to include `src/index.ts` and `src/cli.ts`
  - [x] Ensure the CLI entry retains its hashbang and the library entry does not
- [x] Task: Create `src/index.ts` as the public library entry point
  - [x] Export `defineConfig` and `MizzleConfig` from `./config`
- [x] Task: Update `package.json` to reflect new entry points
  - [x] Update `bin` to point to `./dist/cli.js`
  - [x] Add `exports` field for proper ESM/Library support
- [x] Task: Conductor - User Manual Verification 'Project Structure Update' (Protocol in workflow.md)

## Phase 2: Configuration Alignment & Type Safety [checkpoint: bc9bb59]

- [x] Task: Refine `MizzleConfig` and `defineConfig` in `src/config.ts`
  - [x] Write TDD tests in `test/config-alignment.test.ts` to verify `defineConfig` returns the correct shape and `MizzleConfig` enforces required fields (`schema`, `out`)
  - [x] Update `MizzleConfig` interface in `src/config.ts` to ensure fields are standardized and `dialect` is omitted
  - [x] Implement any necessary refinements to `defineConfig` helper
- [x] Task: Conductor - User Manual Verification 'Configuration Alignment & Type Safety' (Protocol in workflow.md)

## Phase 3: CLI Integration & Verification [checkpoint: 374a57c]

- [x] Task: Verify `loadConfig` compatibility with updated `MizzleConfig`
  - [x] Write integration tests in `test/cli/define-config-integration.test.ts` to ensure `loadConfig` correctly imports a `mizzle.config.ts` using `defineConfig`
  - [x] Run `bun run check` to ensure project-wide type safety
  - [x] Run `bun run test` to ensure no regressions in CLI commands
- [x] Task: Conductor - User Manual Verification 'CLI Integration Verification' (Protocol in workflow.md)
