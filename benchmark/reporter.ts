import { ExtendedMetrics } from "./metrics";

export class Reporter {
    static generateMarkdown(results: ExtendedMetrics[], scaleName: string): string {
        let md = `### Scale: ${scaleName}\n\n`;
        md += "| Operation | Ops/sec | Latency (ms) | Mem Delta (MB) | CPU User (ms) | CPU System (ms) |\n";
        md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";

        for (const r of results) {
            md += `| ${r.name} | ${r.opsPerSecond.toFixed(2)} | ${r.latencyMs.toFixed(4)} | ${r.memoryDeltaMb.toFixed(2)} | ${r.cpuUserDeltaMs.toFixed(2)} | ${r.cpuSystemDeltaMs.toFixed(2)} |\n`;
        }

        return md + "\n";
    }
}
