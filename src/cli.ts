#!/usr/bin/env bun
import { Command } from "commander";
import * as p from "@clack/prompts";
import { loadConfig } from "./config";
import { generateCommand } from "./cli/commands/generate";
import { initCommand } from "./cli/commands/init";
import { pushCommand } from "./cli/commands/push";
import { listCommand } from "./cli/commands/list";
import { dropCommand } from "./cli/commands/drop";

const program = new Command();

program
  .name("mizzle")
  .description("Mizzle Migration CLI")
  .version("0.0.1");

program
  .command("init")
  .description("Initialize Mizzle configuration")
  .action(async () => {
    try {
        await initCommand();
    } catch (e: any) {
        p.log.error(e.message);
        process.exit(1);
    }
  });

program
  .command("generate")
  .description("Generate a new migration snapshot and script")
  .option("-n, --name <name>", "Migration name")
  .action(async (options) => {
    try {
        const config = await loadConfig();
        await generateCommand({ config, name: options.name });
    } catch (e: any) {
        p.log.error(e.message);
        process.exit(1);
    }
  });

program
  .command("push")
  .description("Directly apply schema changes to the target DynamoDB environment")
  .option("-y, --yes", "Skip confirmation")
  .action(async (options) => {
    try {
        const config = await loadConfig();
        await pushCommand({ config, force: options.yes });
    } catch (e: any) {
        p.log.error(e.message);
        process.exit(1);
    }
  });

program
  .command("list")
  .description("List all existing DynamoDB tables in the environment")
  .action(async () => {
    try {
        const config = await loadConfig();
        await listCommand({ config });
    } catch (e: any) {
        p.log.error(e.message);
        process.exit(1);
    }
  });

program
  .command("drop")
  .description("Interactive command to select and delete DynamoDB tables")
  .action(async () => {
    try {
        const config = await loadConfig();
        await dropCommand({ config });
    } catch (e: any) {
        p.log.error(e.message);
        process.exit(1);
    }
  });

program.parse();