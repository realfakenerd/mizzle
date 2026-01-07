import { AWSSDKBench } from "./sdk-bench";
import { MizzleBench } from "./mizzle-bench";
import { DynamooseBench } from "./dynamoose-bench";
import { ElectroDBBench } from "./electrodb-bench";
import { DataGenerator } from "./data-gen";
import { runBenchmarkTask, ExtendedMetrics } from "./metrics";
import { createTable, deleteTable, waitForTable } from "./setup";

async function main() {
    const scaleArg = Bun.argv[2] || "both";
    
    const allScales = [
        { name: "Small", count: 1000, iterations: 100 },
        { name: "Large", count: 10000, iterations: 10 } // Reduced large scale for stability in local dev
    ];

    const scales = scaleArg === "both" 
        ? allScales 
        : allScales.filter(s => s.name.toLowerCase() === scaleArg.toLowerCase());

    if (scales.length === 0) {
        console.error(`Unknown scale: ${scaleArg}. Use 'small', 'large', or 'both'.`);
        process.exit(1);
    }
        console.log(`\n--- Scale: ${scale.name} (${scale.count} items) ---`);

        // Setup
        await deleteTable();
        await createTable();
        await waitForTable();

        const gen = new DataGenerator();
        const data = gen.generateBatch(scale.count);
        const item = data[0];

        console.log(`Seeding ${scale.count} items...`);
        const sdk = new AWSSDKBench();
        // Seed in batches for speed if possible, but for now just loop
        for (let i = 0; i < data.length; i++) {
            await sdk.putItem(data[i]);
            if (i % 100 === 0 && i > 0) process.stdout.write(".");
        }
        console.log("\nSeeding complete.");

        const competitors = [
            { name: "AWS SDK v3", bench: new AWSSDKBench() },
            { name: "Mizzle", bench: new MizzleBench() },
            { name: "Dynamoose", bench: new DynamooseBench() },
            { name: "ElectroDB", bench: new ElectroDBBench() },
        ];

        const allResults: ExtendedMetrics[] = [];

        for (const comp of competitors) {
            console.log(`\nRunning ${comp.name}...`);
            
            // PutItem
            const putRes = await runBenchmarkTask(`${comp.name}: PutItem`, async () => {
                await comp.bench.putItem(item);
            }, scale.iterations);
            allResults.push(putRes);

            // GetItem
            const getRes = await runBenchmarkTask(`${comp.name}: GetItem`, async () => {
                await comp.bench.getItem(item.pk, item.sk);
            }, scale.iterations);
            allResults.push(getRes);

            // UpdateItem
            const updateRes = await runBenchmarkTask(`${comp.name}: UpdateItem`, async () => {
                await comp.bench.updateItem(item.pk, item.sk, { name: "Updated Name" });
            }, scale.iterations);
            allResults.push(updateRes);

            // Query
            const queryRes = await runBenchmarkTask(`${comp.name}: Query`, async () => {
                await comp.bench.queryItems(item.pk);
            }, scale.iterations);
            allResults.push(queryRes);

            // Scan
            const scanRes = await runBenchmarkTask(`${comp.name}: Scan`, async () => {
                await comp.bench.scanItems();
            }, scale.iterations);
            allResults.push(scanRes);

            // DeleteItem
            const delRes = await runBenchmarkTask(`${comp.name}: DeleteItem`, async () => {
                await comp.bench.deleteItem(item.pk, item.sk);
            }, scale.iterations);
            allResults.push(delRes);
        }

        // Output results for this scale
        console.table(allResults.map(r => ({
            Operation: r.name,
            "Ops/sec": r.opsPerSecond.toFixed(2),
            "Latency (ms)": r.latencyMs.toFixed(4),
            "Mem Delta (MB)": r.memoryDeltaMb.toFixed(2),
        })));
    }

    await deleteTable();
    console.log("\nBenchmark Suite Complete.");
}

main().catch(console.error);
