import { Task } from "tinybench";

export interface ExtendedMetrics {
    name: string;
    opsPerSecond: number;
    latencyMs: number;
    memoryDeltaMb: number;
    cpuUserDeltaMs: number;
    cpuSystemDeltaMs: number;
}

export interface ResourceMetrics {
    memoryDeltaMb: number;
    cpuUserDeltaMs: number;
    cpuSystemDeltaMs: number;
}

export class MetricsCollector {
    private starts = new Map<string, { mem: number, cpu: NodeJS.CpuUsage }>();
    private results = new Map<string, ResourceMetrics>();

    // These need to be bound or called with the task context
    beforeAll(task: Task) {
        this.starts.set(task.name, {
            mem: process.memoryUsage().heapUsed,
            cpu: process.cpuUsage()
        });
    }

    afterAll(task: Task) {
        const start = this.starts.get(task.name);
        if (!start) return;

        const endCpu = process.cpuUsage(start.cpu);
        const endMemory = process.memoryUsage().heapUsed;

        this.results.set(task.name, {
            memoryDeltaMb: (endMemory - start.mem) / (1024 * 1024),
            cpuUserDeltaMs: endCpu.user / 1000,
            cpuSystemDeltaMs: endCpu.system / 1000
        });
    }

    get(taskName: string): ResourceMetrics {
        return this.results.get(taskName) || {
            memoryDeltaMb: 0,
            cpuUserDeltaMs: 0,
            cpuSystemDeltaMs: 0
        };
    }
}