import { getColumnBuilders } from "./packages/mizzle/src/columns/index";
import * as columns from "./packages/mizzle/src/columns/index";

console.log("Verifying column builders export...");

const builders = getColumnBuilders();
const expectedTypes = [
    "binary",
    "binarySet",
    "boolean",
    "json",
    "list",
    "map",
    "number",
    "numberSet",
    "string",
    "stringSet",
    "uuid",
];

let allPresent = true;
for (const type of expectedTypes) {
    if (typeof (builders as any)[type] !== "function") {
        console.error(`❌ Column type "${type}" is missing from getColumnBuilders()`);
        allPresent = false;
    }
}

if (allPresent) {
    console.log("✅ getColumnBuilders is working correctly.");
    console.log("✅ All expected column types are present.");
}

console.log("Verifying exports...");
if (typeof columns.string === "function" && typeof columns.number === "function") {
    console.log("✅ Named exports are working correctly.");
} else {
    console.error("❌ Named exports are failing.");
}
