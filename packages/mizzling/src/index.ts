#!/usr/bin/env bun
import { Command } from "commander";
import * as p from "@clack/prompts";
import { loadConfig } from "./config";
import { generateCommand } from "./commands/generate";
import { initCommand } from "./commands/init";
import { pushCommand } from "./commands/push";
import { listCommand } from "./commands/list";
import { dropCommand } from "./commands/drop";

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
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        p.log.error(message);
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
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        p.log.error(message);
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
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        p.log.error(message);
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
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        p.log.error(message);
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
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        p.log.error(message);
        process.exit(1);
    }
  });

program.parse();