import nextConfig from "eslint-config-next";
import coreWebVitalsConfig from "eslint-config-next/core-web-vitals";

const config = [
    ...coreWebVitalsConfig,
    {
        // Custom rules or overrides
        rules: {
            "@next/next/no-html-link-for-pages": "off",
            "react-hooks/set-state-in-effect": "off",
        }
    }
];

export default config;
