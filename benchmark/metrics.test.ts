import { describe, it, expect } from "vitest";
import { MetricsCollector } from "./metrics";
import { Bench } from "tinybench";

describe("MetricsCollector", () => {
    it("should track memory and cpu usage via hooks", async () => {
        const collector = new MetricsCollector();
        const bench = new Bench({ iterations: 10 });

        bench.add("resource-test", () => {
            const arr = new Array(100000).fill(0);
            void arr.length;
        }, {
            beforeAll: function() { collector.beforeAll(this); },
            afterAll: function() { collector.afterAll(this); }
        });

        await bench.run();

        const metrics = collector.get("resource-test");

        expect(typeof metrics.memoryDeltaMb).toBe("number");
        expect(typeof metrics.cpuUserDeltaMs).toBe("number");
        expect(typeof metrics.cpuSystemDeltaMs).toBe("number");
    });

    it("should return zero metrics for unknown task", () => {
        const collector = new MetricsCollector();
        const metrics = collector.get("unknown");

        expect(metrics.memoryDeltaMb).toBe(0);
        expect(metrics.cpuUserDeltaMs).toBe(0);
        expect(metrics.cpuSystemDeltaMs).toBe(0);
    });
});
