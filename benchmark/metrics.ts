export interface Metrics {
    latencyMs: number;
    memoryDeltaMb: number;
    cpuUserDelta: number;
    cpuSystemDelta: number;
}

export class MetricsTracker {
    private startTime: number = 0;
    private startMemory: number = 0;
    private startCpu: NodeJS.CpuUsage | null = null;

    start() {
        this.startTime = performance.now();
        this.startMemory = process.memoryUsage().heapUsed;
        this.startCpu = process.cpuUsage();
    }

    stop(): Metrics {
        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(this.startCpu!);

        return {
            latencyMs: endTime - this.startTime,
            memoryDeltaMb: (endMemory - this.startMemory) / (1024 * 1024),
            cpuUserDelta: endCpu.user / 1000, // convert to ms
            cpuSystemDelta: endCpu.system / 1000, // convert to ms
        };
    }
}
