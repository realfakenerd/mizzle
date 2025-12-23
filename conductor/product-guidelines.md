# Product Guidelines - Mizzle

## Documentation & Communication Style

- **Approachable & Educational:** Documentation should not just state facts but teach concepts. Use clear examples and guides to help users transition from SQL or raw DynamoDB to Mizzle.
- **Tone:** Friendly yet professional, prioritizing the user's learning journey.

## Code Standards & Conventions

- **Self-Documenting Code:** Prioritize descriptive variable and function names.
- **The "Why" Over the "What":** Code comments should focus on the reasoning behind complex logic rather than describing what the code does.
- **Drizzle Consistency:** Maintain naming patterns and API structures that feel familiar to Drizzle ORM users to lower the barrier to entry.
- **TSDoc/JSDoc:** All public APIs must be documented with TSDoc to provide a first-class experience within modern IDEs.
- **TypeScript Strictness:** Leverage TypeScript's type system to its fullest to provide compile-time guarantees for the user.

## Design & Branding

- **Minimalist & Light:** The visual identity should reflect the library's name and its goal of being a "light" wrapper.
- **Core Pillars:** Simplicity and Fluidity. Every feature and API should feel smooth and easy to use.

## Philosophy

- **"No-Magic" Policy:** Avoid overly complex abstractions that hide behavior from the developer. The mapping between Mizzle code and DynamoDB operations should be clear and traceable.
- **Trust through Transparency:** By making the internal logic easy to understand, we build confidence in the library's reliability.
