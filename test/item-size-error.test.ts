import { describe, it, expect } from "vitest";
import { ItemSizeExceededError } from "mizzle";

describe("ItemSizeExceededError", () => {
    it("should be an instance of Error", () => {
        const error = new ItemSizeExceededError("Item too large");
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ItemSizeExceededError);
    });

    it("should have correct name and message", () => {
        const error = new ItemSizeExceededError("Size 500KB exceeds 400KB limit");
        expect(error.name).toBe("ItemSizeExceededError");
        expect(error.message).toBe("Size 500KB exceeds 400KB limit");
    });
});
