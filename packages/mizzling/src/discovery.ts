import { type MizzleConfig } from "./config";
import { PhysicalTable, Entity } from "mizzle/table";
import fg from "fast-glob";
import { stat } from "fs/promises";
import { resolve } from "path";

export async function discoverSchema(config: MizzleConfig): Promise<{ tables: PhysicalTable[], entities: Entity[] }> {
  const schemaPatterns = Array.isArray(config.schema) ? config.schema : [config.schema];
  const tables: PhysicalTable[] = [];
  const entities: Entity[] = [];
  const scannedFiles = new Set<string>();

  const processFile = async (file: string) => {
    const absolutePath = resolve(process.cwd(), file);
    if (scannedFiles.has(absolutePath)) return;
    scannedFiles.add(absolutePath);
    
    try {
        const imported = await import(absolutePath);
        for (const key in imported) {
            const exportVal = imported[key];
            if (exportVal instanceof PhysicalTable) {
                tables.push(exportVal);
            } else if (exportVal instanceof Entity) {
                entities.push(exportVal);
            }
        }
    } catch (e) {
        console.warn(`Failed to import schema file: ${absolutePath}`, e);
    }
  };

  for (const pattern of schemaPatterns) {
    let searchPattern = pattern;
    let isDirectFile = false;
    
    try {
        const stats = await stat(pattern);
        if (stats.isDirectory()) {
            searchPattern = `${pattern}/**/*.{ts,js,tsx,jsx}`;
        } else if (stats.isFile()) {
            isDirectFile = true;
        }
    } catch {
        // Not a file/dir, assume it's a glob pattern
    }

    if (isDirectFile) {
        await processFile(pattern);
        continue;
    }

    const files = await fg(searchPattern, { absolute: true });
    for (const file of files) {
        await processFile(file);
    }
  }

  return { tables, entities };
}
