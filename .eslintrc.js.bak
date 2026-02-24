// .eslintrc.js
module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: undefined, // si usas project refs, apunta al tsconfig
  },

  env: {
    browser: true,
    es2022: true,
    node: true,
  },

  plugins: [
    '@typescript-eslint',
    'tailwindcss',     // 👈 añade el plugin de Tailwind v4 (4.0.0-beta.0)
    'prettier',
  ],

  extends: [
    'next/core-web-vitals',                 // Next 15 / React 19
    // 'next/typescript',                   // opcional; si te duplica reglas con @typescript-eslint, quítalo
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',       // 👈 reglas de Tailwind v4
    'plugin:prettier/recommended',
  ],

  settings: {
    tailwindcss: {
      // Asegura que el plugin entienda tu config de Tailwind v4
      config: 'tailwind.config.ts',
      // Nombres de utilidades/helpers donde sueles pasar classNames
      callees: ['cn', 'cva', 'clsx'],
      // Si usas templates etiquetados para clases, actívalo:
      // taggedTemplateLiterals: ['tw'], 
    },
  },

  rules: {
    // TS
    '@typescript-eslint/no-explicit-any': 'warn',
    // Prettier como fuente de verdad de formato
    'prettier/prettier': 'error',
  },

  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'coverage/',
    '*.min.js',
  ],

  overrides: [
    // Ajustes más laxos para archivos de config y scripts
    {
      files: ['*.config.{js,cjs,mjs,ts}', 'scripts/**/*.{js,ts}'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
