import { join } from "path";
import { existsSync } from "fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";

export interface MizzleConfig {
  schema: string | string[];
  out: string;
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  profile?: string;
  maxAttempts?: number;
}

export function defineConfig(config: MizzleConfig): MizzleConfig {
  return config;
}

export function getClient(config: MizzleConfig): DynamoDBClient {
  const clientConfig: any = {
    region: config.region || "us-east-1",
    endpoint: config.endpoint,
    maxAttempts: config.maxAttempts,
  };

  if (config.credentials) {
    clientConfig.credentials = config.credentials;
  } else if (config.profile) {
    clientConfig.credentials = fromIni({ profile: config.profile });
  } else if (
    config.endpoint &&
    (config.endpoint.includes("localhost") || config.endpoint.includes("127.0.0.1"))
  ) {
    clientConfig.credentials = {
      accessKeyId: "local",
      secretAccessKey: "local",
    };
  }

  return new DynamoDBClient(clientConfig);
}

export async function loadConfig(configName = "mizzle.config.ts"): Promise<MizzleConfig> {
  const envConfig = process.env.MIZZLE_CONFIG;
  const configPath = envConfig || join(process.cwd(), configName);

  if (!existsSync(configPath)) {
    throw new Error(`Could not find ${configName} in current directory.`);
  }

  try {
    const imported = await import(configPath);
    const config = imported.default || imported;

    if (!config || typeof config !== "object") {
       throw new Error("Invalid config: default export must be an object");
    }

    if (!config.schema) {
      throw new Error("Invalid config: missing 'schema' path");
    }

    if (!config.out) {
      throw new Error("Invalid config: missing 'out' directory");
    }

    const finalConfig = { ...config } as MizzleConfig;

    if (process.env.MIZZLE_REGION) finalConfig.region = process.env.MIZZLE_REGION;
    if (process.env.MIZZLE_ENDPOINT) finalConfig.endpoint = process.env.MIZZLE_ENDPOINT;
    if (process.env.MIZZLE_SCHEMA) finalConfig.schema = process.env.MIZZLE_SCHEMA;
    if (process.env.MIZZLE_OUT) finalConfig.out = process.env.MIZZLE_OUT;

    return finalConfig;
  } catch (error: any) {
    if (error.message.startsWith("Invalid config")) {
        throw error;
    }
    throw new Error(`Failed to load config: ${error.message}`);
  }
}