/**
 * Error thrown when a DynamoDB item exceeds the 400KB limit.
 */
export class ItemSizeExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ItemSizeExceededError";
        
        // This is necessary for some environments to correctly maintain the prototype chain
        Object.setPrototypeOf(this, ItemSizeExceededError.prototype);
    }
}

/**
 * Detailed reason for a transaction cancellation.
 */
export interface CancellationReason {
    index: number;
    code: string;
    message?: string;
    item?: Record<string, any>;
}

/**
 * Error thrown when a DynamoDB transaction is canceled.
 */
export class TransactionFailedError extends Error {
    constructor(message: string, public readonly reasons: CancellationReason[]) {
        super(message);
        this.name = "TransactionFailedError";
        
        Object.setPrototypeOf(this, TransactionFailedError.prototype);
    }
}
