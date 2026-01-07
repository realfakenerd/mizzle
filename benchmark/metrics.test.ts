import { describe, it, expect } from "bun:test";
import { MetricsTracker } from "./metrics";

describe("MetricsTracker", () => {
    it("should track latency", async () => {
        const tracker = new MetricsTracker();
        tracker.start();
        await new Promise(resolve => setTimeout(resolve, 100));
        const metrics = tracker.stop();

        expect(metrics.latencyMs).toBeGreaterThanOrEqual(100);
        expect(metrics.latencyMs).toBeLessThan(200);
    });

    it("should track memory usage delta", () => {
        const tracker = new MetricsTracker();
        tracker.start();
        
        // Allocate some memory
        const arr = new Array(1000000).fill(0);
        
        const metrics = tracker.stop();
        // Memory delta might be small or even negative due to GC, 
        // but we want to ensure it's a number and captured.
        expect(typeof metrics.memoryDeltaMb).toBe("number");
        
        // Use arr to prevent it from being GC'd too early
        expect(arr.length).toBe(1000000);
    });

    it("should track CPU usage delta", async () => {
        const tracker = new MetricsTracker();
        tracker.start();
        
        // Busy wait to consume CPU
        const start = Date.now();
        while (Date.now() - start < 50) {
            Math.sqrt(Math.random());
        }
        
        const metrics = tracker.stop();
        expect(typeof metrics.cpuUserDelta).toBe("number");
        expect(typeof metrics.cpuSystemDelta).toBe("number");
        expect(metrics.cpuUserDelta + metrics.cpuSystemDelta).toBeGreaterThanOrEqual(0);
    });
});
