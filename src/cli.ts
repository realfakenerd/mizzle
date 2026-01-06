#!/usr/bin/env bun
import { Command } from "commander";
import * as p from "@clack/prompts";

const program = new Command();

program
  .name("mizzle")
  .description("Mizzle Migration CLI")
  .version("0.0.1");

program
  .command("generate")
  .description("Generate a new migration snapshot and script")
  .action(() => {
    p.intro("Mizzle: Generate Migration");
    p.outro("Coming soon!");
  });

program
  .command("push")
  .description("Directly apply schema changes to the target DynamoDB environment")
  .action(() => {
    p.intro("Mizzle: Push Schema");
    p.outro("Coming soon!");
  });

program
  .command("list")
  .description("List all existing DynamoDB tables in the environment")
  .action(() => {
    p.intro("Mizzle: List Tables");
    p.outro("Coming soon!");
  });

program
  .command("drop")
  .description("Interactive command to select and delete DynamoDB tables")
  .action(() => {
    p.intro("Mizzle: Drop Table");
    p.outro("Coming soon!");
  });

program.parse();

