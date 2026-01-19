import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';
import path from 'path';

function checkJSDoc(filePath: string, methods: string[]) {
    const content = readFileSync(filePath, 'utf-8');
    methods.forEach(method => {
        it(`should have JSDoc for method: ${method} in ${path.basename(filePath)}`, () => {
            // Simpler escaping for common method names
            const escapedMethod = method.replace(/[.*+?^${}()|[\\]/g, '\\$&');
            // Match JSDoc optionally followed by modifiers and the method name
            const regex = new RegExp(`\\/\\*[\\s\\S]*?\\*\\/\\s*(?:override\\s+|async\\s+|public\\s+|private\\s+|static\\s+)*${escapedMethod}\\b`);
            const hasMatch = regex.test(content);
            expect(hasMatch, `Method ${method} is missing JSDoc in ${filePath}`).toBe(true);
        });
    });
}

describe('JSDoc Presence for Builders', () => {
    describe('SelectBuilder', () => {
        const filePath = path.resolve(__dirname, '../packages/mizzle/src/builders/select.ts');
        const methods = ['from', 'where', 'limit', 'pageSize', 'consistentRead', 'sort', 'index', 'iterator', 'execute'];
        checkJSDoc(filePath, methods);
    });

    describe('InsertBuilder', () => {
        const filePath = path.resolve(__dirname, '../packages/mizzle/src/builders/insert.ts');
        const methods = ['values', 'returning', 'execute'];
        checkJSDoc(filePath, methods);
    });

    describe('UpdateBuilder', () => {
        const filePath = path.resolve(__dirname, '../packages/mizzle/src/builders/update.ts');
        const methods = ['key', 'set', 'add', 'remove', 'delete', 'where', 'returning', 'execute'];
        checkJSDoc(filePath, methods);
    });

    describe('DeleteBuilder', () => {
        const filePath = path.resolve(__dirname, '../packages/mizzle/src/builders/delete.ts');
        const methods = ['returning', 'execute'];
        checkJSDoc(filePath, methods);
    });
});