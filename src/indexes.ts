export interface IndexColumnConfig {
    pk?: string;
    sk?: string;
}

export class IndexBuilder {
    constructor(
        public type: "gsi" | "lsi",
        public config: IndexColumnConfig,
    ) {}
}

export function gsi(pkColumn: string, skColumn?: string) {
    return new IndexBuilder("gsi", { pk: pkColumn, sk: skColumn });
}

export function lsi(skColumn: string) {
    return new IndexBuilder("lsi", { sk: skColumn });
}
