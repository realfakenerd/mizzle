# Specification: Drizzle-aligned Configuration (`defineConfig`)

## Overview
Expose and standardize the configuration method for Mizzle by exporting a `defineConfig` helper from the `@aurios/mizzling` package. This aligns the developer experience with `drizzle-kit`, making configuration more intuitive for users familiar with the Drizzle ecosystem.

## Functional Requirements
1.  **Public Export:** Export `defineConfig` and the `MizzleConfig` type from the `@aurios/mizzling` entry point.
2.  **Configuration Helper:** The `defineConfig` function should provide type safety and autocompletion for the configuration object.
3.  **Drizzle-aligned Schema:** 
    -   `schema`: Path or glob to schema files (required).
    -   `out`: Directory for migrations and snapshots (required).
4.  **Flat AWS Configuration:** Maintain connection settings at the root level for simplicity, but ensure terminology is clear.
    -   `region`: AWS Region.
    -   `endpoint`: Custom DynamoDB endpoint.
    -   `profile`: AWS CLI profile.
    -   `credentials`: Explicit AWS credentials object.

## Non-Functional Requirements
-   **TypeScript Support:** Ensure full type safety for the configuration object.
-   **Backward Compatibility:** The internal `loadConfig` logic must continue to work with the updated exports.

## Acceptance Criteria
-   Users can run `import { defineConfig } from "@aurios/mizzling"` in a `mizzle.config.ts` file.
-   The CLI successfully loads and validates the configuration defined via `defineConfig`.
-   The `dialect` field is NOT required or present in the configuration.

## Out of Scope
-   Moving AWS settings into a `dbCredentials` block (user opted for flat structure).
-   Supporting multiple database dialects.
