# Plan: Documentation with Astro and Starlight

## Phase 1: Foundation ## Phase 1: Foundation & Scaffolding Scaffolding [checkpoint: 8fc475f]
Initialize the documentation project and integrate it into the monorepo.

- [x] Task: Initialize Astro project with Starlight template in `docs/` using `bun create astro@latest -- --template starlight` (fd8090a)
- [x] Task: Add `docs` to workspaces in root `package.json` and run `bun install` (4a462ed)
- [x] Task: Configure `turbo.json` tasks for the `docs` workspace (`build`, `lint`, `check`) (1781338)
- [x] Task: Implement basic linting and type checking in `docs/package.json` (cb9be35)
- [ ] Task: Conductor - User Manual Verification 'Foundation & Scaffolding' (Protocol in workflow.md)

## Phase 2: Core Guides & Conceptual Content [checkpoint: 46ae78c]
Establish the foundational narrative and usage guides.

- [x] Task: Create "Introduction & Vision" content based on `product.md` (d7d5302)
- [x] Task: Create "Getting Started" guide (Installation, Config, First Query) (7b99582)
- [x] Task: Create "Single-Table Design" guide (Prefixing, Static Keys, Composite Keys) (7b99582)
- [ ] Task: Conductor - User Manual Verification 'Core Guides & Conceptual Content' (Protocol in workflow.md)

## Phase 3: API & CLI Reference [checkpoint: 8e87e6a]
Detailed documentation of the technical interfaces.

- [x] Task: Create API Reference pages for `select`, `insert`, `update`, `delete`, and `query` (a01dea6)
- [x] Task: Create CLI Guide for the `mizzling` tool (Migrations, Init, List, Push, Drop) (fa7588a)
- [x] Task: Verify all internal documentation links and code examples (51d8b35)
- [ ] Task: Conductor - User Manual Verification 'API & CLI Reference' (Protocol in workflow.md)

## Phase 4: Deployment & Polish
Finalize the site for production and host on Vercel.

- [ ] Task: Configure `vercel.json` and project settings for documentation hosting
- [ ] Task: Perform a production build and audit performance/accessibility
- [ ] Task: Conductor - User Manual Verification 'Deployment & Polish' (Protocol in workflow.md)
