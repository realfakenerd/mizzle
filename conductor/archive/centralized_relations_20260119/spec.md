# Specification: Centralized Relational Definition API

## Overview

Standardize and centralize how relationships are defined in Mizzle. This track replaces the per-entity `defineRelations` call with a single, schema-aware `defineRelations` function that resolves circular dependencies and provides superior type-safety for joining keys.

## Functional Requirements

1.  **Centralized API:** `defineRelations` must accept an object containing all relevant entities (the "schema").
2.  **Entity-Keyed Definition:** The callback should return an object where keys correspond to entity names from the schema, and values contain the relationship definitions for that entity.
3.  **Typed Helpers:** The callback helper (`r`) must provide:
    - `r.one.<entityName>(config)`: Define a 1:1 or N:1 relation to a specific entity in the schema.
    - `r.many.<entityName>(config)`: Define a 1:N or N:M relation to a specific entity in the schema.
    - `r.<entityName>.<columnName>`: Typed references to columns of entities in the schema for use in `from` and `to` configuration.
4.  **Backward Compatibility (Internal):** Ensure `extractMetadata` can still resolve these relationships into the internal format used by the `db.query` API.

## API Example

```typescript
export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));
```

## Non-Functional Requirements

- **Strict Typing:** Relationship targets and join columns must be strictly typed based on the provided schema object.
- **Circular Dependency Safety:** The API must not require entities to import each other's relation definitions.

## Acceptance Criteria

- The new `defineRelations` syntax is implemented and fully typed.
- `extractMetadata` correctly parses the centralized definition into internal metadata.
- `db.query` functions correctly using the new relations definition.
- Tests verify that circular relationships (User -> Posts, Posts -> User) work without runtime errors.
