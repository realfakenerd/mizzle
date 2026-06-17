import { join } from "path";
import { existsSync } from "fs";
import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
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
  /**
   * Print all SQL statements (or DynamoDB commands) and their execution time.
   */
  verbose?: boolean;
  /**
   * Require user confirmation before pushing any changes to the database.
   */
  strict?: boolean;
  /**
   * Optional nested database credentials (compatible with Drizzle-style config).
   */
  dbCredentials?: {
    region?: string;
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    profile?: string;
  };
}

/**
 * Helper function to define the Mizzle CLI configuration with type safety and autocompletion.
 *
 * Typically used in a `mizzle.config.ts` file at the root of your project.
 *
 * @example
 * ```ts
 * import { defineConfig } from "@aurios/mizzling";
 *
 * export default defineConfig({
 *   schema: "./src/schema.ts",
 *   out: "./mizzle",
 *   region: "us-east-1",
 * });
 * ```
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

  const region = config.region || config.dbCredentials?.region || "us-east-1";
  const endpoint = config.endpoint || config.dbCredentials?.endpoint;
  const credentials = config.credentials || config.dbCredentials?.credentials;
  const profile = config.profile || config.dbCredentials?.profile;

  const clientConfig: DynamoDBClientConfig = {
    region,
    endpoint,
    maxAttempts: config.maxAttempts,
    requestHandler: new NodeHttpHandler({
      httpAgent: new http.Agent(agentOptions),
      httpsAgent: new https.Agent(agentOptions),
    }),
  };

  if (credentials) {
    clientConfig.credentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      ...(credentials.sessionToken ? { sessionToken: credentials.sessionToken } : {}),
    };
  } else if (profile) {
    clientConfig.credentials = fromIni({ profile });
  } else if (endpoint && (endpoint.includes("localhost") || endpoint.includes("127.0.0.1"))) {
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
export async function loadConfig(configName?: string): Promise<MizzleConfig> {
  const envConfig = process.env.MIZZLE_CONFIG;
  let configPath = envConfig;

  if (!configPath) {
    const tsPath = join(process.cwd(), configName || "mizzle.config.ts");
    const jsPath = join(process.cwd(), configName || "mizzle.config.js");

    if (existsSync(tsPath)) {
      configPath = tsPath;
    } else if (existsSync(jsPath)) {
      configPath = jsPath;
    } else {
      throw new Error(`Could not find ${configName || "mizzle.config.ts/js"} in current directory.`);
    }
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
    if (process.env.MIZZLE_VERBOSE) finalConfig.verbose = process.env.MIZZLE_VERBOSE === "true";
    if (process.env.MIZZLE_STRICT) finalConfig.strict = process.env.MIZZLE_STRICT === "true";

    return finalConfig;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid config")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load config: ${message}`);
  }
}
