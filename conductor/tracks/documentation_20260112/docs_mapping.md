# Documentation Mapping

## Public API Reference (`docs/src/content/docs/reference/`)

| Code Module | Target Doc File | Status | Notes |
| :--- | :--- | :--- | :--- |
| `builders/insert.ts` | `insert.md` | Existing | Review and expand "Fluent Writes" concepts here or in a summary page. |
| `builders/update.ts` | `update.md` | Existing | Review and expand. |
| `builders/delete.ts` | `delete.md` | Existing | Review and expand. |
| `builders/select.ts` | `select.md` | Existing | Covers "Unified Select". Expand with edge cases? |
| `builders/transaction.ts` | `transactions.md` | **New** | Covers `db.transaction()` and `TransactWriteItems`. |
| `builders/batch*.ts` | `transactions.md` | **New** | Group Batch operations with Transactions or separate `batch.md`? Plan says "Transactions and Batch operations". |

## Internals (`docs/src/content/docs/internals/`) - **New Directory**

| Code Module | Target Doc File | Status | Notes |
| :--- | :--- | :--- | :--- |
| `expressions/builder.ts` | `expression-builder.md` | **New** | How expressions are compiled to strings/values. |
| `expressions/update-builder.ts` | `expression-builder.md` | **New** | Include update expressions here. |
| `builders/relational-builder.ts`| `relational-proxy.md` | **New** | How `.findMany` works, recursive fetching. |
| `core/parser.ts` | `relational-proxy.md` | **New** | `ItemCollectionParser` logic. |

## Guides (`docs/src/content/docs/guides/`)

| Concept | Target Doc File | Status | Notes |
| :--- | :--- | :--- | :--- |
| System Design | `architecture.md` | **New** | High-level overview of Mizzle's architecture. |

## Recommendation for Phase 2 Implementation
- Instead of creating `fluent-writes.md`, verify and enhance `insert.md`, `update.md`, `delete.md`.
- Instead of creating `unified-select.md`, verify and enhance `select.md`.
- Create `transactions.md` for Transactions and Batch.
