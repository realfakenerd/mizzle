import { expect, test, describe } from "bun:test";
import { Reporter } from "./reporter";
import type { ExtendedMetrics } from "./metrics";

describe("Reporter", () => {
    test("should generate markdown table from results", () => {
        const results: ExtendedMetrics[] = [
            {
                name: "Test Ops",
                opsPerSecond: 1000.555,
                latencyMs: 1.23456,
                memoryDeltaMb: 0.5,
                cpuUserDeltaMs: 10,
                cpuSystemDeltaMs: 5
            }
        ];

        const md = Reporter.generateMarkdown(results, "Small");
        expect(md).toContain("### Scale: Small");
        expect(md).toContain("| Test Ops | 1000.55 | 1.2346 | 0.50 | 10.00 | 5.00 |");
    });
});
