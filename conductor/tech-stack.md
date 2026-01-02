# Technology Stack - Mizzle

## Core Technologies

- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5+) - Provides strict type safety and a modern development experience.
- **Runtime & Tooling:** [Bun](https://bun.sh/) - Used as the fast all-in-one JavaScript runtime, package manager, and test runner.

## Data & Storage

- **Database:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) - The target NoSQL database.
- **SDK:** [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb) & [@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/lib-dynamodb) (v3) - Official AWS SDK for low-level and high-level (Document Client) interactions.

## Development & Testing

- **Testing:** [Vitest](https://vitest.dev/) - A Vite-native unit test framework, utilized for its speed and compatibility with TypeScript/Bun.
- **ID Generation:** [uuid](https://www.npmjs.com/package/uuid) - Used for generating unique identifiers, including v7 UUIDs.
- **Static Analysis:** [TypeScript Compiler (tsc)](https://www.typescriptlang.org/) - Used with the `--noEmit` flag for continuous type-safety verification.

## Constraints

- **Peer Dependencies:** `typescript` is a peer dependency to ensure compatibility with the consumer's environment.
- **Compatibility:** Optimized for execution in Bun environments, while remaining compatible with standard Node.js environments where possible.
