import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { intro, outro, text, isCancel, cancel } from "@clack/prompts";

export async function initCommand() {
  const configPath = join(process.cwd(), "mizzle.config.ts");

  if (existsSync(configPath)) {
    console.log("mizzle.config.ts already exists in the current directory. Aborting.");
    return;
  }

  intro("Mizzle Initialization");

  const schema = await text({
    message: "Where is your schema file or directory located?",
    placeholder: "./src/schema.ts",
    initialValue: "./src/schema.ts",
    validate: (value) => {
      if (!value) return "Schema path is required";
    },
  });

  if (isCancel(schema)) {
    cancel("Operation cancelled.");
    return;
  }

  const out = await text({
    message: "Where should Mizzle store migrations and snapshots?",
    placeholder: "./migrations",
    initialValue: "./migrations",
    validate: (value) => {
      if (!value) return "Output directory is required";
    },
  });

  if (isCancel(out)) {
    cancel("Operation cancelled.");
    return;
  }

  const region = await text({
    message: "Which AWS region do you want to use?",
    placeholder: "us-east-1",
    initialValue: "us-east-1",
  });

  if (isCancel(region)) {
    cancel("Operation cancelled.");
    return;
  }

  const endpoint = await text({
    message: "Do you want to use a custom endpoint (e.g., for local development)?",
    placeholder: "http://localhost:8000 (optional)",
  });

  if (isCancel(endpoint)) {
    cancel("Operation cancelled.");
    return;
  }

  const configContent = `import { defineConfig } from "mizzle";

export default defineConfig({
  schema: "${schema}",
  out: "${out}",
  region: "${region}",
  ${endpoint ? `endpoint: "${endpoint}",` : "// endpoint: \"http://localhost:8000\","}
});
`;

  writeFileSync(configPath, configContent);

  outro(`mizzle.config.ts created successfully!`);
}
