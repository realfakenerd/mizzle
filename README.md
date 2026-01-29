# 🌧️ mizzle

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/realfakenerd/mizzle/release.yml?style=flat&color=0EA5E9)
![GitHub License](https://img.shields.io/github/license/realfakenerd/mizzle?style=flat&color=0EA5E9)

**Mizzle** is a light and _type-safe_ ORM for **DynamoDB** built with TypeScript. It is designed to provide a "Drizzle-like" developer experience, simplifying your interactions with DynamoDB through a fluid, intuitive API while handling the complexities of Single-Table Design.

## Vision

Mizzle aims to minimize boilerplate and maximize developer velocity. It abstracts away the raw DynamoDB JSON structures and key management, allowing you to define your data models using familiar TypeScript schemas and interact with them using a SQL-like query builder.

## How It Works

Mizzle separates the concept of the **Physical Table** (the actual DynamoDB table) from the **Entity** (the logical data model). This approach is tailored for DynamoDB's Single-Table Design patterns.

1.  **Physical Table:** Defines the partition key (PK), sort key (SK), and global secondary indexes (GSIs) of your DynamoDB table.
2.  **Entity:** Defines the schema of your data (users, posts, orders) and maps it to the physical table using **Key Strategies**.

Key Strategies (like `prefixKey`) automatically handle the construction of PK/SK values based on your data, so you don't have to manually string-concatenate "USER#123" every time.

## Mono-bi-pkg

This is a monorepo, if you want to you can read each individual package's README for more details:

- [mizzle](https://github.com/realfakenerd/mizzle/tree/main/packages/mizzle)
- [mizzling](https://github.com/realfakenerd/mizzle/tree/main/packages/mizzling)

Or better yet, visit [the documentation](https://mizzle-docs.vercel.app)

## Contributing

Contributions are welcome! Please open an problem or submit a pr ;).

## License

MIT
