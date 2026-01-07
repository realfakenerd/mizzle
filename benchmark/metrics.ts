import { Bench } from "tinybench";

export interface ExtendedMetrics {
    name: string;
    opsPerSecond: number;
    latencyMs: number;
    memoryDeltaMb: number;
    cpuUserDeltaMs: number;
    cpuSystemDeltaMs: number;
}

/**
 * Runs a single task using tinybench and captures additional resource usage metrics.
 * Note: Resource usage is captured for the entire run (including multiple iterations).
 */
export async function runBenchmarkTask(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 100
): Promise<ExtendedMetrics> {
    const bench = new Bench({ iterations });
    
    // We capture resource usage for the entire benchmark run
    const startMemory = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();
    
    bench.add(name, fn);
    await bench.run();
    
    const endCpu = process.cpuUsage(startCpu);
    const endMemory = process.memoryUsage().heapUsed;
    
    const task = bench.getTask(name)!;
    const result = task.result!;
    
    return {
        name,
        // In tinybench v3+, result structure changed. 
        // result.latency.mean is in ms.
        // result.throughput.mean is ops/sec (equivalent to old hz).
        opsPerSecond: result.throughput.mean,
        latencyMs: result.latency.mean,
        memoryDeltaMb: (endMemory - startMemory) / (1024 * 1024),
        cpuUserDeltaMs: endCpu.user / 1000,
        cpuSystemDeltaMs: endCpu.system / 1000,
    };
}
