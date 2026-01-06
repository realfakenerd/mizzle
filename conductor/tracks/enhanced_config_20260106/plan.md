# Implementation Plan - Enhanced CLI Configuration

This plan details the steps to enhance the Mizzle CLI configuration and AWS integration.

## Phase 1: Configuration Expansion
Enhance the configuration schema and client utility.

- [~] Task: Update `MizzleConfig` interface and `defineConfig` helper in `src/config.ts`
- [ ] Task: Refactor `getClient` in `src/config.ts` to support profiles and explicit credentials
- [ ] Task: Implement environment variable override logic in `loadConfig`

## Phase 2: `init` Command
Implement the interactive initialization command.

- [ ] Task: Create `src/cli/commands/init.ts` with Clack prompts
- [ ] Task: Wire up the `init` command in `src/cli.ts`
- [ ] Task: Add tests for the `init` command

## Phase 3: Validation & Testing
Ensure the new configuration system works across different scenarios.

- [ ] Task: Add unit tests for `getClient` with various configuration combinations
- [ ] Task: Update E2E tests to verify environment variable overrides
