---
title: Update Actions
description: Reference for Mizzle's update actions (SET, ADD, REMOVE, DELETE).
---

Update actions are used within the `.set()` method of an `update` operation to modify specific attributes of an item without overwriting the entire record.

## Available Actions

### `add(value)`

Adds a value to a numeric attribute or a set.

```typescript
// Increment count by 1
db.update(stats).set({ count: add(1) })
```

### `append(values)`

Appends values to the end of a list. Maps to DynamoDB's `list_append`.

```typescript
db.update(users).set({ roles: append(["editor"]) })
```

### `ifNotExists(value)`

Sets a value only if the attribute does not already exist.

```typescript
db.update(users).set({ createdAt: ifNotExists(new Date()) })
```

### `remove()`

Removes an attribute from the item.

```typescript
db.update(users).set({ temporaryToken: remove() })
```

### `addToSet(values)`

Adds unique values to a string, number, or binary set.

```typescript
db.update(users).set({ tags: addToSet(["featured", "new"]) })
```

### `deleteFromSet(values)`

Removes specific values from a set.

```typescript
db.update(users).set({ tags: deleteFromSet(["old"]) })
```

## Advanced Example

```typescript
import { add, append, remove } from "@aurios/mizzle";

await db.update(users)
  .set({
    loginCount: add(1),
    lastLogins: append([new Date()]),
    resetToken: remove()
  })
  .where(eq(users.id, "123"))
  .execute();
```
