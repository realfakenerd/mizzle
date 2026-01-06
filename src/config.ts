import { join } from "path";
import { existsSync } from "fs";

export interface MizzleConfig {
  schema: string | string[];
  out: string;
}

export async function loadConfig(configName = "mizzle.config.ts"): Promise<MizzleConfig> {
  const configPath = join(process.cwd(), configName);

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

    return config as MizzleConfig;
  } catch (error: any) {
    if (error.message.startsWith("Invalid config")) {
        throw error;
    }
    throw new Error(`Failed to load config: ${error.message}`);
  }
}