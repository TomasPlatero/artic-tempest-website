import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

try {
    const config = compat.extends("next/core-web-vitals", "next/typescript");
    console.log("Number of config objects:", config.length);
    config.forEach((c, i) => {
        console.log(`\nConfig Object ${i}:`);
        console.log("Keys:", Object.keys(c));
        if (c.languageOptions) {
            console.log("languageOptions keys:", Object.keys(c.languageOptions));
        }
        // Check for common forbidden keys in Flat Config
        ["parser", "plugins", "env", "globals", "extends", "overrides", "ignorePatterns"].forEach(key => {
            if (c[key]) console.log(`Forbidden key found at root: ${key}`);
        });
    });
} catch (e) {
    console.error("Error loading config:");
    console.error(e);
}
