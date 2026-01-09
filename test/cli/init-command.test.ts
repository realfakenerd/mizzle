import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { initCommand } from "../../packages/mizzling/src/commands/init";
import { writeFileSync, existsSync, rmSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import * as prompts from "@clack/prompts";

vi.mock("@clack/prompts", () => ({
    intro: vi.fn(),
    outro: vi.fn(),
    text: vi.fn(),
    isCancel: vi.fn((val) => typeof val === "symbol" && val.toString().includes("clack:cancel")),
    note: vi.fn(),
    cancel: vi.fn(),
}));

const TEMP_DIR = join(tmpdir(), "mizzle-init-test-" + Date.now());

describe("Init Command", () => {
    const originalCwd = process.cwd();

    beforeEach(() => {
        mkdirSync(TEMP_DIR, { recursive: true });
        process.chdir(TEMP_DIR);
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.chdir(originalCwd);
        rmSync(TEMP_DIR, { recursive: true, force: true });
    });

    test("should create mizzle.config.ts with user input", async () => {
        // Mock prompts
        (prompts.text as any).mockImplementation(
            async (options: any) => {
                const message = options.message;
                if (message.includes("schema")) return "./src/schema.ts";
                if (message.includes("output")) return "./migrations";
                if (message.includes("region")) return "us-east-1";
                if (message.includes("endpoint"))
                    return "http://localhost:8000";
                return options.initialValue || "";
            },
        );

        await initCommand();

        expect(existsSync(join(TEMP_DIR, "mizzle.config.ts"))).toBe(true);
        const content = readFileSync(
            join(TEMP_DIR, "mizzle.config.ts"),
            "utf-8",
        );
        expect(content).toContain('schema: "./src/schema.ts"');
        expect(content).toContain('out: "./migrations"');
        expect(content).toContain('region: "us-east-1"');
        expect(content).toContain('endpoint: "http://localhost:8000"');
    });

    test("should abort if mizzle.config.ts already exists", async () => {
        writeFileSync(join(TEMP_DIR, "mizzle.config.ts"), "existing");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await initCommand();

        expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining("already exists"),
        );
    });

    test("should abort if user cancels", async () => {
        const CANCEL = Symbol.for("clack:cancel");
        (prompts.text as any).mockResolvedValue(CANCEL as any);
        (prompts.isCancel as any).mockReturnValue(true);

        await initCommand();

        expect(existsSync(join(TEMP_DIR, "mizzle.config.ts"))).toBe(false);
    });
});
