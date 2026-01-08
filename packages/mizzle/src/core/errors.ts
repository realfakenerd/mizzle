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
