import { describe, it, expect } from "vitest";
import { mizzle, DynamoDB } from "mizzle/db";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe("Resilience Configuration", () => {
    const client = new DynamoDBClient({ region: "us-east-1" });

    it("should allow configuring retry settings", () => {
        const db = mizzle({
            client,
            retry: {
                maxAttempts: 5,
                baseDelay: 100,
            },
        });

        expect(db).toBeInstanceOf(DynamoDB);
        // @ts-expect-error - testing internal property
        expect(db.retryConfig).toEqual({
            maxAttempts: 5,
            baseDelay: 100,
        });
    });

    it("should have default retry settings if not provided", () => {
        const db = mizzle(client);
        
        // @ts-expect-error - testing internal property
        expect(db.retryConfig).toEqual({
            maxAttempts: 3,
            baseDelay: 100,
        });
    });
});
