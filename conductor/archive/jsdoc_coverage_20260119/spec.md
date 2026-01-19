# Specification: Comprehensive JSDoc Documentation

## Overview
Enhance the developer experience (DX) of Mizzle by adding comprehensive JSDoc (TSDoc) documentation to all public APIs. This will enable developers to understand and use the library directly within their IDEs (via IntelliSense/Hover) without needing to frequently refer to external documentation.

## Functional Requirements
1.  **High-Priority Coverage:** Add JSDocs to the following core areas:
    -   **Query Builders:** `db.select()`, `db.insert()`, `db.update()`, `db.delete()`, and their chainable methods (`where`, `values`, `limit`, etc.).
    -   **Schema Definition:** `defineTable`, `defineRelations`, and all column builders (`string`, `number`, `uuid`, `date`, `json`, etc.).
    -   **Initialization:** `mizzle()` constructor and `defineConfig`.
2.  **Comprehensive Content:** Each JSDoc block must include:
    -   A clear, concise description of the function/method.
    -   Detailed `@param` descriptions for all arguments.
    -   `@returns` description explaining the output.
    -   `@example` blocks showing practical, real-world usage patterns.
    -   `@throws` documentation for common error cases where applicable.
3.  **Rich Formatting:** Utilize Markdown within JSDoc comments for lists, bold text, and code blocks to ensure maximum readability in IDE popups.

## Non-Functional Requirements
-   **IDE Compatibility:** Ensure the documentation renders correctly in major IDEs like VS Code and WebStorm.
-   **Maintenance:** JSDocs should be kept in sync with the actual implementation.

## Acceptance Criteria
-   Developers can hover over any core Mizzle API in their IDE and see a clear description and usage example.
-   The code builds without any documentation-related warnings or errors.
-   All high-priority functions identified in the requirements are covered.

## Out of Scope
-   Internal-only utility functions not intended for public use.
-   Auto-generating a documentation website from these JSDocs (this track is for the source code documentation only).
