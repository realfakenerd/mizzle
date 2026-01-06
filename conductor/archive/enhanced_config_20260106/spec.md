# Specification: Enhanced CLI Configuration & AWS Integration

## Overview
Improve the Mizzle CLI configuration system to support a wider range of AWS environments beyond local development. This includes support for specific credentials, AWS profiles, and more flexible initialization.

## Functional Requirements

### 1. Expanded Configuration
- Update `MizzleConfig` to include:
    - `credentials`: Object with `accessKeyId`, `secretAccessKey`, and optional `sessionToken`.
    - `profile`: String for AWS profile name.
    - `maxAttempts`: Optional retry logic configuration.

### 2. Intelligent Client Creation
- Refactor `getClient` to:
    - Use `credentials` from config if present.
    - Use the specified `profile` if present.
    - Default to the AWS SDK's standard credential provider chain if neither is provided (allowing IAM roles, environment variables, etc., to work out-of-the-box).
    - Only provide "local" defaults if explicitly configured or in a specific development mode.

### 3. Environment Variable Support
- Support standard environment variables for overrides:
    - `MIZZLE_REGION`
    - `MIZZLE_ENDPOINT`
    - `MIZZLE_SCHEMA`
    - `MIZZLE_OUT`

### 4. `init` Command
- Implement `mizzle init`:
    - Checks for existing `mizzle.config.ts`.
    - Prompts for schema path, output directory, region, and optional local endpoint.
    - Generates a `mizzle.config.ts` using the `defineConfig` helper.

## Acceptance Criteria
- [ ] `mizzle list` works with an AWS Profile without hardcoded credentials.
- [ ] `mizzle init` successfully creates a valid config file.
- [ ] Environment variables correctly override `mizzle.config.ts` values.
