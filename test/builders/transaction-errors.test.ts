import { describe, it, expect, vi } from "vitest";
import { TransactionExecutor } from "../../packages/mizzle/src/builders/transaction";
import { TransactionFailedError } from "../../packages/mizzle/src/core/errors";
import { IMizzleClient } from "../../packages/mizzle/src/core/client";

describe("Transaction Error Parsing", () => {
    const mockClient = { send: vi.fn() } as unknown as IMizzleClient;

    it("should parse TransactionCanceledException into TransactionFailedError", async () => {
        const executor = new TransactionExecutor(mockClient);
        
        const error = new Error("Transaction Canceled");
        (error as any).name = "TransactionCanceledException";
        (error as any).CancellationReasons = [
            { Code: "None" },
            { Code: "ConditionalCheckFailed", Message: "Condition failed" }
        ];

        vi.mocked(mockClient.send).mockRejectedValueOnce(error);

        try {
            await executor.execute("token", []);
            expect.fail("Should have thrown TransactionFailedError");
        } catch (e) {
            expect(e).toBeInstanceOf(TransactionFailedError);
            const txErr = e as TransactionFailedError;
            expect(txErr.reasons).toHaveLength(1);
            expect(txErr.reasons[0]).toMatchObject({
                index: 1,
                code: "ConditionalCheckFailed",
                message: "Condition failed"
            });
        }
    });

    it("should rethrow other errors", async () => {
        const executor = new TransactionExecutor(mockClient);
        const otherError = new Error("Other error");
        vi.mocked(mockClient.send).mockRejectedValueOnce(otherError);

        await expect(executor.execute("token", [])).rejects.toThrow("Other error");
    });
});
