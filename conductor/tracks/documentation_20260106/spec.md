# Specification: Documentation with Astro and Starlight

## Overview
Implement a comprehensive documentation website for Mizzle to improve developer onboarding and provide a clear API reference. The site will be built using Astro with the Starlight template and hosted on Vercel.

## Goals
- Provide a modern, searchable documentation site.
- Establish a "Getting Started" path for new users.
- Document the core ORM API and the `mizzling` CLI.
- Educate users on Mizzle's approach to Single-Table Design.

## Functional Requirements
- **Project Setup:**
    - Initialize an Astro project using the Starlight template in a top-level `docs/` directory.
    - Add `docs/` to the Bun workspaces in the root `package.json`.
    - Configure Turborepo to handle `build` and `lint` tasks for the `docs/` workspace.
- **Content Structure:**
    - **Introduction & Vision:** High-level overview based on `product.md`.
    - **Getting Started:** Step-by-step installation and configuration guide.
    - **API Reference:** Manual documentation of `select`, `insert`, `update`, `delete`, and `query`.
    - **CLI Guide:** Detailed instructions for the `mizzling` binary.
    - **Single-Table Design Guide:** Explanations of `prefixKey`, `staticKey`, and `compositeKey`.
- **Deployment:**
    - Configure Vercel deployment for the `docs/` workspace.

## Non-Functional Requirements
- **Performance:** Maintain high Lighthouse scores for performance and accessibility.
- **Maintainability:** Use Markdown/MDX for content to allow easy updates.

## Acceptance Criteria
- [ ] `docs/` directory contains a functional Starlight site.
- [ ] `bun run build` and `bun run lint` execute successfully within the `docs/` workspace.
- [ ] All specified content sections are present and accurate.
- [ ] The documentation site is successfully deployed to and accessible on Vercel.

## Out of Scope
- Automated API generation from source code (e.g., TypeDoc).
- Advanced customized components beyond Starlight's standard offerings.
