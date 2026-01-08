export interface RetryConfig {
    /**
     * Maximum number of attempts (including the initial one).
     * @default 3
     */
    maxAttempts: number;
    /**
     * Base delay in milliseconds for exponential backoff.
     * @default 100
     */
    baseDelay: number;
}

const RETRYABLE_ERRORS = new Set([
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "InternalServerError",
    "ServiceUnavailable",
    "ThrottlingException",
]);

const RETRYABLE_STATUS_CODES = new Set([500, 503]);

export class RetryHandler {
    constructor(private config: RetryConfig) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: unknown;
        
        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt >= this.config.maxAttempts || !this.isRetryable(error)) {
                    throw error;
                }
                
                await this.delay(attempt - 1);
            }
        }
        
        throw lastError;
    }

    private isRetryable(error: any): boolean {
        if (!error) return false;
        
        if (RETRYABLE_ERRORS.has(error.name)) {
            return true;
        }

        if (error.$metadata?.httpStatusCode && RETRYABLE_STATUS_CODES.has(error.$metadata.httpStatusCode)) {
            return true;
        }

        // AWS SDK v3 specific error structure sometimes wraps things
        return false;
    }

    private async delay(retryCount: number): Promise<void> {
        const base = this.config.baseDelay * Math.pow(2, retryCount);
        const jitter = Math.random() * base; // Full jitter or equal jitter? Standard is random between 0 and base.
        // Cap at some reasonable max if needed, but for now standard exponential + jitter
        const delayTime = base + jitter;
        
        return new Promise(resolve => setTimeout(resolve, delayTime));
    }
}
