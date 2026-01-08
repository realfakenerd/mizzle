import { MizzleBench } from "./mizzle-bench";
import { AWSSDKBench } from "./sdk-bench";
import { DataGenerator, type BenchmarkItem } from "./data-gen";
import { MetricsCollector, type ExtendedMetrics } from "./metrics";
import { createTable, deleteTable, waitForTable } from "./setup";
import { Reporter } from "./reporter";
import { writeFileSync } from "fs";
import { Bench } from "tinybench";

interface Operation {
    name: string;
    run: (bench: MizzleBench, item: BenchmarkItem) => Promise<void>;
}

async function main() {
    const scaleArg = Bun.argv[2] || "both";
    
    const allScales = [
        { name: "Small", count: 1000, iterations: 100 },
        { name: "Large", count: 10000, iterations: 10 }
    ];

    const scales = scaleArg === "both" 
        ? allScales 
        : allScales.filter(s => s.name.toLowerCase() === scaleArg.toLowerCase());

    if (scales.length === 0) {
        console.error(`Unknown scale: ${scaleArg}. Use 'small', 'large', or 'both'.`);
        process.exit(1);
    }

    console.log("Starting Mizzle-Only Benchmark...");

    let finalMarkdown = "# Mizzle Benchmark Results\n\n";

    for (const scale of scales) {
        console.log(`\n=== Scale: ${scale.name} (${scale.count} items) ===`);

        // Setup
        await deleteTable();
        await createTable();
        await waitForTable();

        const gen = new DataGenerator();
        const data = gen.generateBatch(scale.count);
        const item = data[0]!;

        console.log(`Seeding ${scale.count} items...`);
        // We still use AWS SDK for efficient seeding
        const sdk = new AWSSDKBench();
        for (let i = 0; i < data.length; i++) {
            await sdk.putItem(data[i]!);
            if (i % 100 === 0 && i > 0) process.stdout.write(".");
        }
        console.log("\nSeeding complete.");

        const mizzleBench = new MizzleBench();

        const operations: Operation[] = [
            { 
                name: "PutItem", 
                run: async (b, i) => { await b.putItem(i); } 
            },
            { 
                name: "GetItem", 
                run: async (b, i) => { await b.getItem(i.pk, i.sk); } 
            },
            { 
                name: "UpdateItem", 
                run: async (b, i) => { await b.updateItem(i.pk, i.sk, { name: "Updated Name" }); } 
            },
            { 
                name: "Query", 
                run: async (b, i) => { await b.queryItems(i.pk); } 
            },
            { 
                name: "Scan", 
                run: async (b, i) => { await b.scanItems(); } 
            },
            { 
                name: "DeleteItem", 
                run: async (b, i) => { await b.deleteItem(i.pk, i.sk); } 
            }
        ];

        const scaleResults: ExtendedMetrics[] = [];

        for (const op of operations) {
            console.log(`\n--- Operation: ${op.name} ---`);
            
            const bench = new Bench({ iterations: scale.iterations });
            const collector = new MetricsCollector();

            bench.add("Mizzle", async () => {
                await op.run(mizzleBench, item);
            }, {
                beforeAll: function() { collector.beforeAll(this); },
                afterAll: function() { collector.afterAll(this); }
            });

            await bench.run();

            // Collect results
            const opResults: ExtendedMetrics[] = bench.tasks.map(task => {
                const result = task.result as any;
                const resourceMetrics = collector.get(task.name);
                
                if (!result || result.error) {
                    console.error(`Task ${task.name} failed:`, result?.error);
                    return {
                        name: `${task.name}: ${op.name}`,
                        opsPerSecond: 0,
                        latencyMs: 0,
                        ...resourceMetrics
                    };
                }

                return {
                    name: `${task.name}: ${op.name}`,
                    opsPerSecond: result.throughput.mean,
                    latencyMs: result.latency.mean,
                    ...resourceMetrics
                };
            });

            // Print table for this operation
            console.table(opResults.map(r => ({
                Competitor: r.name.split(":")[0],
                "Ops/sec": r.opsPerSecond.toFixed(2),
                "Latency (ms)": r.latencyMs.toFixed(4),
                "Mem Delta (MB)": r.memoryDeltaMb.toFixed(2),
                "CPU (ms)": (r.cpuUserDeltaMs + r.cpuSystemDeltaMs).toFixed(2)
            })));

            scaleResults.push(...opResults);
        }

        finalMarkdown += Reporter.generateMarkdown(scaleResults, scale.name);
    }

    writeFileSync("mizzle-results.md", finalMarkdown);
    console.log("\nResults saved to mizzle-results.md");

    await deleteTable();
    console.log("\nBenchmark Suite Complete.");
}

main().catch(console.error);