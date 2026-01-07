export interface BenchmarkItem {
    pk: string;
    sk: string;
    name: string;
    email: string;
    age: number;
    active: boolean;
    createdAt: string;
    payload: string; // To add some weight
}

export class DataGenerator {
    generateItem(index: number): BenchmarkItem {
        return {
            pk: `USER#${index}`,
            sk: "METADATA",
            name: `User ${index}`,
            email: `user${index}@example.com`,
            age: 20 + (index % 50),
            active: index % 2 === 0,
            createdAt: new Date().toISOString(),
            payload: "x".repeat(100), // 100 bytes of extra weight
        };
    }

    generateBatch(count: number): BenchmarkItem[] {
        const items: BenchmarkItem[] = [];
        for (let i = 1; i <= count; i++) {
            items.push(this.generateItem(i));
        }
        return items;
    }
}
