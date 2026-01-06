import { expect, test, describe, beforeEach, afterEach, spyOn } from "bun:test";
import { loadConfig, defineConfig, getClient } from "../../src/config";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import * as credentialProviders from "@aws-sdk/credential-provider-ini";

const TEMP_DIR = join(tmpdir(), "mizzle-config-expansion-test-" + Date.now());

describe("Config Expansion", () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    mkdirSync(TEMP_DIR, { recursive: true });
    process.chdir(TEMP_DIR);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  test("defineConfig should accept expanded properties", () => {
    const config = defineConfig({
      schema: "./schema.ts",
      out: "./out",
      profile: "test",
      maxAttempts: 3
    });
    expect(config.profile).toBe("test");
    expect(config.maxAttempts).toBe(3);
  });

  test("should load config with expanded properties", async () => {
    const configName = "mizzle.config.expanded.ts";
    const configContent = `
      export default {
        schema: "./src/schema",
        out: "./migrations",
        credentials: {
          accessKeyId: "AKIA",
          secretAccessKey: "SECRET",
          sessionToken: "TOKEN"
        },
        profile: "my-profile",
        maxAttempts: 5
      };
    `;
    writeFileSync(join(TEMP_DIR, configName), configContent);
    
    const config = await loadConfig(configName);
    expect(config).toEqual({
      schema: "./src/schema",
      out: "./migrations",
      credentials: {
        accessKeyId: "AKIA",
        secretAccessKey: "SECRET",
        sessionToken: "TOKEN"
      },
      profile: "my-profile",
      maxAttempts: 5
    });
  });

  test("getClient should use provided credentials", async () => {
    const config = {
      schema: "./schema.ts",
      out: "./out",
      region: "us-west-2",
      credentials: {
        accessKeyId: "test-key",
        secretAccessKey: "test-secret"
      }
    };
    const client = getClient(config);
    const resolvedConfig = await client.config.credentials();
    expect(resolvedConfig.accessKeyId).toBe("test-key");
    expect(resolvedConfig.secretAccessKey).toBe("test-secret");
    expect(await client.config.region()).toBe("us-west-2");
  });

  test("getClient should use default credentials if no credentials or profile provided", async () => {
    const originalEnv = { ...process.env };
    process.env.AWS_ACCESS_KEY_ID = "env-key";
    process.env.AWS_SECRET_ACCESS_KEY = "env-secret";
    process.env.AWS_REGION = "us-east-1";

    try {
      const config = {
        schema: "./schema.ts",
        out: "./out",
      };
      const client = getClient(config);
      const resolvedConfig = await client.config.credentials();
      expect(resolvedConfig.accessKeyId).toBe("env-key");
    } finally {
      process.env = originalEnv;
    }
  });

  test("getClient should use local defaults if endpoint is localhost and no credentials provided", async () => {
    const config = {
      schema: "./schema.ts",
      out: "./out",
      endpoint: "http://localhost:8000"
    };
    const client = getClient(config);
    const resolvedConfig = await client.config.credentials();
    expect(resolvedConfig.accessKeyId).toBe("local");
  });

  test("getClient should use profile if provided", async () => {
    const fromIniSpy = spyOn(credentialProviders, "fromIni");
    const config = {
      schema: "./schema.ts",
      out: "./out",
      profile: "my-profile"
    };
    getClient(config);
    expect(fromIniSpy).toHaveBeenCalledWith({ profile: "my-profile" });
    fromIniSpy.mockRestore();
  });
});
