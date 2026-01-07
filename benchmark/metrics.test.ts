import { describe, it, expect } from "bun:test";
import { runBenchmarkTask } from "./metrics";

describe("runBenchmarkTask", () => {
    it("should track latency and ops per second using tinybench", async () => {
        const metrics = await runBenchmarkTask("test-task", async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
        }, 5); // small iterations for test

        expect(metrics.name).toBe("test-task");
        expect(metrics.latencyMs).toBeGreaterThanOrEqual(10);
        expect(metrics.opsPerSecond).toBeGreaterThan(0);
    });

    it("should track memory usage delta", async () => {
        const metrics = await runBenchmarkTask("memory-test", () => {
            const arr = new Array(1000000).fill(0);
            void arr.length;
        }, 10);
        
        expect(typeof metrics.memoryDeltaMb).toBe("number");
    });

    it("should track CPU usage delta", async () => {
        const metrics = await runBenchmarkTask("cpu-test", () => {
            const start = Date.now();
            while (Date.now() - start < 20) {
                Math.sqrt(Math.random());
            }
        }, 5);
        
        expect(typeof metrics.cpuUserDeltaMs).toBe("number");
        expect(typeof metrics.cpuSystemDeltaMs).toBe("number");
    });
});