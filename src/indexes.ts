import type { Column } from "./column";

export class GsiBuilder {
    constructor(private config: GSI) {}

    build(): GSI {
        return this.config;
    }
}

export interface GSI {
    name: string;
    pk: Column;
    sk?: Column;
}

export const gsi = (config: GSI) => new GsiBuilder(config);

export class LsiBuilder {
    constructor(private config: LSI) {}

    build(): LSI {
        return this.config;
    }
}

export interface LSI {
    name: string;
    sk: Column;
}

export const lsi = (config: LSI) => new LsiBuilder(config);
