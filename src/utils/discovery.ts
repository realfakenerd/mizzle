import { MizzleConfig } from "../config";
import { PhysicalTable } from "../core/table";
import { Glob } from "bun";
import { stat } from "fs/promises";

export async function discoverSchema(config: MizzleConfig): Promise<PhysicalTable[]> {
  const schemaPatterns = Array.isArray(config.schema) ? config.schema : [config.schema];
  const tables: PhysicalTable[] = [];
  const scannedFiles = new Set<string>();

  const processFile = async (file: string) => {
    if (scannedFiles.has(file)) return;
    scannedFiles.add(file);
    
    try {
        const imported = await import(file);
        for (const key in imported) {
            const exportVal = imported[key];
            if (exportVal instanceof PhysicalTable) {
                tables.push(exportVal);
            }
        }
    } catch (e) {
        console.warn(`Failed to import schema file: ${file}`, e);
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

    const glob = new Glob(searchPattern);
    for await (const file of glob.scan({ cwd: process.cwd(), absolute: true })) {
        await processFile(file);
    }
  }

  return tables;
}
