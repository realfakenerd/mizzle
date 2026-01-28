import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import path from "path";

describe("JSDoc Presence for Schema Definition", () => {
  describe("Core Schema Functions", () => {
    const filePath = path.resolve(__dirname, "../src/core/table.ts");
    const content = readFileSync(filePath, "utf-8");
    const methods = ["dynamoTable", "dynamoEntity"];

    methods.forEach((method) => {
      it(`should have JSDoc for export: ${method}`, () => {
        const escapedMethod = method.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:function\\s+)?${escapedMethod}\\b`,
        );
        const hasMatch = regex.test(content);
        expect(hasMatch, `Export ${method} is missing JSDoc in ${filePath}`).toBe(true);
      });
    });
  });

  describe("Initialization", () => {
    const filePath = path.resolve(__dirname, "../src/db.ts");
    const content = readFileSync(filePath, "utf-8");
    const methods = ["mizzle"];

    methods.forEach((method) => {
      it(`should have JSDoc for export: ${method}`, () => {
        const escapedMethod = method.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:function\\s+)?${escapedMethod}\\b`,
        );
        const hasMatch = regex.test(content);
        expect(hasMatch, `Export ${method} is missing JSDoc in ${filePath}`).toBe(true);
      });
    });
  });

  describe("CLI Config", () => {
    const filePath = path.resolve(__dirname, "../../mizzling/src/config.ts");
    const content = readFileSync(filePath, "utf-8");
    const methods = ["defineConfig"];

    methods.forEach((method) => {
      it(`should have JSDoc for export: ${method}`, () => {
        const escapedMethod = method.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:function\\s+)?${escapedMethod}\\b`,
        );
        const hasMatch = regex.test(content);
        expect(hasMatch, `Export ${method} is missing JSDoc in ${filePath}`).toBe(true);
      });
    });
  });

  describe("Relations", () => {
    const filePath = path.resolve(__dirname, "../src/core/relations.ts");
    const content = readFileSync(filePath, "utf-8");
    const methods = ["defineRelations"];

    methods.forEach((method) => {
      it(`should have JSDoc for export: ${method}`, () => {
        const escapedMethod = method.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:function\\s+)?${escapedMethod}\\b`,
        );
        const hasMatch = regex.test(content);
        expect(hasMatch, `Export ${method} is missing JSDoc in ${filePath}`).toBe(true);
      });
    });
  });

  describe("Column Builders", () => {
    const columnFiles = [
      "string.ts",
      "number.ts",
      "boolean.ts",
      "date.ts",
      "uuid.ts",
      "json.ts",
      "binary.ts",
      "list.ts",
      "map.ts",
      "string-set.ts",
      "number-set.ts",
      "binary-set.ts",
    ];

    columnFiles.forEach((file) => {
      const builderName = file
        .replace(".ts", "")
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()); // camelCase

      it(`should have JSDoc for column builder: ${builderName} in ${file}`, () => {
        const filePath = path.resolve(__dirname, `../src/columns/${file}`);
        const content = readFileSync(filePath, "utf-8");
        const escapedMethod = builderName.replace(/[.*+?^${}()|[\\]/g, "\\$&");
        const regex = new RegExp(
          `\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:export\\s+)?(?:function\\s+)?${escapedMethod}\\b`,
        );
        const hasMatch = regex.test(content);
        expect(hasMatch, `Export ${builderName} is missing JSDoc in ${filePath}`).toBe(true);
      });
    });
  });
});
