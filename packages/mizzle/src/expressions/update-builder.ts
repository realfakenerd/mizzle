import { UpdateAction } from "./actions";

export interface UpdateState {
    set: Record<string, { value: unknown; functionName?: string; usePathAsFirstArg?: boolean }>;
    add: Record<string, unknown>;
    remove: string[];
    delete: Record<string, unknown>;
}

export function createUpdateState(): UpdateState {
    return {
        set: {},
        add: {},
        remove: [],
        delete: {},
    };
}

export function partitionUpdateValues(
    values: Record<string, unknown | UpdateAction>,
    state: UpdateState
): void {
    for (const [key, val] of Object.entries(values)) {
        if (val instanceof UpdateAction) {
            switch (val.action) {
                case "SET":
                    state.set[key] = {
                        value: (val as any).value,
                        functionName: (val as any).functionName,
                        usePathAsFirstArg: (val as any).usePathAsFirstArg,
                    };
                    break;
                case "ADD":
                    state.add[key] = (val as any).value;
                    break;
                case "REMOVE":
                    state.remove.push(key);
                    break;
                case "DELETE":
                    state.delete[key] = (val as any).value;
                    break;
            }
        } else if (val !== undefined) {
            state.set[key] = { value: val };
        }
    }
}

export function buildUpdateExpressionString(
    state: UpdateState,
    addName: (name: string) => string,
    addValue: (value: unknown) => string
): string {
    const sections: string[] = [];

    if (Object.keys(state.set).length > 0) {
        const parts = Object.entries(state.set).map(([key, config]) => {
            const name = addName(key);
            const value = addValue(config.value);
            if (config.functionName) {
                if (config.usePathAsFirstArg) {
                    return `${name} = ${config.functionName}(${name}, ${value})`;
                }
                return `${name} = ${config.functionName}(${value})`;
            }
            return `${name} = ${value}`;
        });
        sections.push(`SET ${parts.join(", ")}`);
    }

    if (Object.keys(state.add).length > 0) {
        const parts = Object.entries(state.add).map(([key, val]) => {
            return `${addName(key)} ${addValue(val)}`;
        });
        sections.push(`ADD ${parts.join(", ")}`);
    }

    if (state.remove.length > 0) {
        const parts = state.remove.map((key) => addName(key));
        sections.push(`REMOVE ${parts.join(", ")}`);
    }

    if (Object.keys(state.delete).length > 0) {
        const parts = Object.entries(state.delete).map(([key, val]) => {
            return `${addName(key)} ${addValue(val)}`;
        });
        sections.push(`DELETE ${parts.join(", ")}`);
    }

    return sections.join(" ");
}
