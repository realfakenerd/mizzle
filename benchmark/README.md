# Mizzle DynamoDB Benchmarks

Performance benchmark suite comparing Mizzle against AWS SDK v3, Dynamoose, and ElectroDB.

## Prerequisites

- [Bun](https://bun.sh/)
- Docker (for DynamoDB Local)

## Setup

1. Start DynamoDB Local:
   ```bash
   docker-compose up -d dynamodb-local
   ```

2. Install dependencies (from the root):
   ```bash
   bun install
   ```

## Running Benchmarks

Execute the benchmark suite using Bun:

```bash
# Run all scales (Small and Large)
bun benchmark/index.ts

# Run specific scale
bun benchmark/index.ts small
bun benchmark/index.ts large
```

## Metrics

The suite captures the following metrics:
- **Ops/sec:** Throughput (higher is better)
- **Latency:** Average execution time (lower is better)
- **Memory Delta:** Heap memory usage increase during the run
- **CPU User/System:** CPU time consumed

## Results



Results are displayed in the console and saved to `results.md` in the current directory.



## Mizzle-Only Benchmark







To benchmark Mizzle in isolation (useful for profiling or focused testing):







1. Run the Mizzle-only benchmark:



   ```bash



   cd benchmark



   bun run bench:mizzle



   # Or with a specific scale:



   bun run bench:mizzle small



   ```







2. For profiling, you can add the `--profile` flag manually:



   ```bash



   bun --profile mizzle-only-bench.ts small



   ```



   Then analyze the profile using the root analysis script:



   ```bash



   cd ..



   bun analyze_profile.ts benchmark/cpu.profile



   ```




