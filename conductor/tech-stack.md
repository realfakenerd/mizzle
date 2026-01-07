# Technology Stack - Mizzle

## Core Technologies

- **Language:** [TypeScript](https://www.typescriptlang.org/) (v5+) - Provides strict type safety and a modern development experience.
- **Runtime & Tooling:** [Bun](https://bun.sh/) - Used as the fast all-in-one JavaScript runtime, package manager, and test runner.
- **Monorepo Management:** [Turborepo](https://turbo.build/) - Orchestrates the build pipeline and provides intelligent caching across packages.

## Data & Storage

- **Database:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) - The target NoSQL database.
- **SDK:** [@aws-sdk/client-dynamodb](https://www.npmjs.com/package/@aws-sdk/client-dynamodb), [@aws-sdk/lib-dynamodb](https://www.npmjs.com/package/@aws-sdk/lib-dynamodb), and [@aws-sdk/credential-provider-ini](https://www.npmjs.com/package/@aws-sdk/credential-provider-ini) (v3) - Official AWS SDK for low-level and high-level (Document Client) interactions.

## Development & Testing

- **Testing:** [Vitest](https://vitest.dev/) - A Vite-native unit test framework, utilized for its speed and compatibility with TypeScript/Bun.
- **ID Generation:** [uuid](https://www.npmjs.com/package/uuid) - Used for generating unique identifiers, including v7 UUIDs.
- **CLI Framework:** [commander](https://www.npmjs.com/package/commander) - For parsing CLI arguments and commands.
- **Interactive CLI UI:** [@clack/prompts](https://www.npmjs.com/package/clack) - For modern, interactive prompts and progress indicators.
- **Benchmarking:** [tinybench](https://github.com/tinylibs/tinybench) - For high-performance micro-benchmarking and statistical analysis.
- **Static Analysis:** [TypeScript Compiler (tsc)](https://www.typescriptlang.org/) - Used with the `--noEmit` flag for continuous type-safety verification.

## Documentation

- **Framework:** [Astro](https://astro.build/) with the [Starlight](https://starlight.astro.build/) template.

## Constraints

- **Peer Dependencies:** `typescript` is a peer dependency to ensure compatibility with the consumer's environment.
- **Compatibility:** Optimized for execution in Bun environments, while remaining compatible with standard Node.js environments where possible.
