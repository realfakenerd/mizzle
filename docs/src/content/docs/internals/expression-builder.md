---
title: Expression Builder
description: How Mizzle compiles TypeScript expressions to DynamoDB syntax.
---

The Expression Builder is the internal engine responsible for converting Mizzle's high-level, type-safe expression objects into the raw string format required by DynamoDB APIs (`FilterExpression`, `ConditionExpression`, `UpdateExpression`).

## The Compilation Process

The compilation process involves three main steps:
1.  **AST Traversal:** Recursively walking the expression tree.
2.  **Substitution:** Replacing attribute names and values with safe placeholders.
3.  **String Generation:** Assembling the final DynamoDB expression string.

### 1. AST Traversal

Mizzle expressions are built using a lightweight Abstract Syntax Tree (AST).
- **`BinaryExpression`**: Represents operations like `eq`, `lt`, `contains`. Has a `column`, `operator`, and `value`.
- **`LogicalExpression`**: Represents `AND`, `OR`, `NOT`. Contains an array of child expressions.
- **`FunctionExpression`**: Represents DynamoDB functions like `attribute_exists`.

The `buildExpression` function (in `packages/mizzle/src/expressions/builder.ts`) visits each node.

### 2. Substitution

To prevent reserved word conflicts (e.g., a column named `data` or `value`) and injection issues, Mizzle **never** puts raw attribute names or values directly into the expression string.

Instead, it uses a Context object provided by the `BaseBuilder` during execution:

- **`addName(name)`**: 
    - Registers the attribute name in `ExpressionAttributeNames`.
    - Returns a placeholder like `#n0`, `#n1`.
    - Handles nested paths (e.g., `user.address.zip` -> `#n0.#n1.#n2`).

- **`addValue(value)`**:
    - Registers the value in `ExpressionAttributeValues`.
    - Returns a placeholder like `:v0`, `:v1`.

### 3. String Generation

Finally, the builder assembles the parts.

**Input (TypeScript):**
```typescript
and(
  eq(users.role, "admin"),
  gt(users.age, 18)
)
```

**Internal Logic:**
1.  Visit `AND` node.
2.  Visit `eq` node. 
    - Call `addName("role")` -> `#n0`. 
    - Call `addValue("admin")` -> `:v0`.
    - Result: `#n0 = :v0`.
3.  Visit `gt` node.
    - Call `addName("age")` -> `#n1`.
    - Call `addValue(18)` -> `:v1`.
    - Result: `#n1 > :v1`.
4.  Join with `AND`.

**Output (DynamoDB):**
- **Expression:** `(#n0 = :v0) AND (#n1 > :v1)`
- **Names:** `{ "#n0": "role", "#n1": "age" }`
- **Values:** `{ ":v0": "admin", ":v1": 18 }`

## Update Expressions

Update expressions (`SET`, `ADD`, `REMOVE`, `DELETE`) are handled by `buildUpdateExpressionString` in `packages/mizzle/src/expressions/update-builder.ts`.

It maintains an `UpdateState` object that categorizes actions by type. When `.execute()` is called, it iterates through this state to generate the specific sections of the `UpdateExpression`.

```typescript
// State
{
  set: { name: { value: "New Name" } },
  add: { loginCount: 1 }
}

// Generated String
"SET #n0 = :v0 ADD #n1 :v1"
```
