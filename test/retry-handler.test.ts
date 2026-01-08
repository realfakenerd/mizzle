import { describe, it, expect, vi } from "vitest";
import { RetryHandler } from "mizzle/core/retry";
import { RetryConfig } from "mizzle";

describe("RetryHandler", () => {
    const config: RetryConfig = {
        maxAttempts: 3,
        baseDelay: 10, // Short delay for tests
    };

    it("should return the result if operation succeeds immediately", async () => {
        const handler = new RetryHandler(config);
        const operation = vi.fn().mockResolvedValue("success");
        
        const result = await handler.execute(operation);
        
        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry if operation fails with a retryable error", async () => {
        const handler = new RetryHandler(config);
        const error = new Error("ThrottlingException");
        error.name = "ProvisionedThroughputExceededException";
        
        const operation = vi.fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValue("success");
        
        const result = await handler.execute(operation);
        
        expect(result).toBe("success");
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should give up after maxAttempts", async () => {
        const handler = new RetryHandler(config);
        const error = new Error("ThrottlingException");
        error.name = "ProvisionedThroughputExceededException";
        
        const operation = vi.fn().mockRejectedValue(error);
        
        await expect(handler.execute(operation)).rejects.toThrow("ThrottlingException");
        expect(operation).toHaveBeenCalledTimes(config.maxAttempts);
    });

    it("should not retry non-retryable errors", async () => {
        const handler = new RetryHandler(config);
        const error = new Error("Validation Error");
        error.name = "ValidationException";
        
        const operation = vi.fn().mockRejectedValue(error);
        
        await expect(handler.execute(operation)).rejects.toThrow("Validation Error");
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should handle non-standard errors gracefully", async () => {
        const handler = new RetryHandler(config);
        const operation = vi.fn().mockRejectedValue("string error");
        
        await expect(handler.execute(operation)).rejects.toBe("string error");
        expect(operation).toHaveBeenCalledTimes(1);
    });
});
