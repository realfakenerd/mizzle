---
title: Fluent Writes
description: Overview of Mizzle's fluent write API.
---

Mizzle provides a consistent, fluent API for all write operations (`insert`, `update`, `delete`). This design pattern allows you to chain methods to build up your operation before executing it against the database.

## The Builder Pattern

All write operations in Mizzle follow the **Builder Pattern**. When you call `db.insert()`, `db.update()`, or `db.delete()`, you are not performing an action immediately. Instead, you are creating a "Builder" object.

You configure this builder by chaining methods (like `.values()`, `.set()`, `.where()`, `.returning()`). Finally, you call `.execute()` to compile the request and send it to DynamoDB.

```typescript
// 1. Create Builder
const builder = db.update(users);

// 2. Configure Builder
builder.set({ name: "Updated" });
builder.where(eq(users.id, "123"));

// 3. Execute
await builder.execute();
```

## Common Methods

While each operation has specific methods, they share some common characteristics:

- **`.execute()`**: The terminal method. It performs the network request.
- **`.returning()`**: Most write operations support retrieving the data state after (or before) the write.
- **Key Resolution**: All builders automatically resolve your logical keys (e.g., `id`) to physical DynamoDB keys (e.g., `pk`, `sk`) using your defined strategies.

## Specific Operations

For detailed API references on each write operation, please see their respective pages:

- [**Insert:**](/reference/insert) Create new items.
- [**Update:**](/reference/update) Modify existing items with granular actions (`SET`, `ADD`, `REMOVE`, `DELETE`).
- [**Delete:**](/reference/delete) Remove items from the table.
