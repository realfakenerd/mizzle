export type ActionType = "SET" | "ADD" | "REMOVE" | "DELETE";

export abstract class UpdateAction {
    abstract readonly action: ActionType;
}

export class SetAction extends UpdateAction {
    readonly action = "SET";
    constructor(
        readonly value: unknown,
        readonly functionName?: "list_append" | "if_not_exists",
        readonly usePathAsFirstArg: boolean = false
    ) {
        super();
    }
}

export class AddAction extends UpdateAction {
    readonly action = "ADD";
    constructor(readonly value: unknown) {
        super();
    }
}

export class RemoveAction extends UpdateAction {
    readonly action = "REMOVE";
}

export class DeleteAction extends UpdateAction {
    readonly action = "DELETE";
    constructor(readonly value: unknown) {
        super();
    }
}

export function add(value: number | Set<unknown>) {
    return new AddAction(value);
}

/**
 * Maps to list_append(path, :value)
 */
export function append(value: unknown[]) {
    return new SetAction(value, "list_append", true);
}

/**
 * Maps to if_not_exists(path, :value)
 */
export function ifNotExists(value: unknown) {
    return new SetAction(value, "if_not_exists", true);
}

export function remove() {
    return new RemoveAction();
}

export function addToSet(values: Set<unknown> | unknown[]) {
    const value = Array.isArray(values) ? new Set(values) : values;
    return new AddAction(value);
}

export function deleteFromSet(values: Set<unknown> | unknown[]) {
    const value = Array.isArray(values) ? new Set(values) : values;
    return new DeleteAction(value);
}
