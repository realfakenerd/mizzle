import { join } from "path";
import { existsSync } from "fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import http from "http";
import https from "https";

/**
 * Configuration for Mizzle ORM.
 */
export interface MizzleConfig {
  /**
   * Path or glob pattern(s) to the schema files.
   */
  schema: string | string[];
  /**
   * Directory where generated migrations and snapshots will be stored.
   */
  out: string;
  /**
   * AWS Region to connect to. Defaults to "us-east-1" if not specified.
   * Can be overridden by MIZZLE_REGION environment variable.
   */
  region?: string;
  /**
   * Optional custom endpoint for DynamoDB (e.g., for local development).
   * Can be overridden by MIZZLE_ENDPOINT environment variable.
   */
  endpoint?: string;
  /**
   * Explicit AWS credentials. If provided, these will be used instead of the
   * default credential provider chain or profile.
   */
  credentials?: {
    /**
     * AWS Access Key ID.
     */
    accessKeyId: string;
    /**
     * AWS Secret Access Key.
     */
    secretAccessKey: string;
    /**
     * Optional AWS Session Token.
     */
    sessionToken?: string;
  };
  /**
   * AWS Profile name to use for credentials.
   */
  profile?: string;
  /**
   * Maximum number of retry attempts for DynamoDB requests.
   */
  maxAttempts?: number;
}

/**
 * Helper function to define the configuration with type safety.
 * 
 * @param config The Mizzle configuration object.
 * @returns The same configuration object, validated by TypeScript.
 */
export function defineConfig(config: MizzleConfig): MizzleConfig {
  return config;
}

/**
 * Creates a configured DynamoDBClient instance based on the provided configuration.
 * 
 * It prioritizes credentials in the following order:
 * 1. Explicitly provided `credentials` object.
 * 2. Explicitly provided AWS `profile`.
 * 3. Default "local" credentials if the endpoint is localhost/127.0.0.1.
 * 4. Default AWS SDK credential provider chain (environment variables, IAM roles, etc.).
 * 
 * @param config The Mizzle configuration.
 * @returns A configured DynamoDBClient instance.
 */
export function getClient(config: MizzleConfig): DynamoDBClient {
  const agentOptions = {
      keepAlive: true,
      maxSockets: Infinity,
  };

  const clientConfig: any = {
    region: config.region || "us-east-1",
    endpoint: config.endpoint,
    maxAttempts: config.maxAttempts,
    requestHandler: new NodeHttpHandler({
        httpAgent: new http.Agent(agentOptions),
        httpsAgent: new https.Agent(agentOptions),
    }),
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

/**
 * Loads the Mizzle configuration from a file (defaulting to mizzle.config.ts).
 * 
 * Environment variables (MIZZLE_REGION, MIZZLE_ENDPOINT, MIZZLE_SCHEMA, MIZZLE_OUT)
 * will override values provided in the configuration file.
 * 
 * @param configName The name of the config file to load.
 * @returns A promise that resolves to the loaded and overridden configuration.
 * @throws Error if the configuration file is missing or invalid.
 */
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
