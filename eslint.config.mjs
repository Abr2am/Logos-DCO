import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/*
 * ESLint est volontairement maintenu en 9.x : `eslint-plugin-react`, embarqué
 * par `eslint-config-next`, utilise encore `context.getFilename()`, supprimé
 * dans ESLint 10. Repasser en 10 casse le lint tant que Next ne l'a pas mis à
 * jour.
 */
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'docs/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },
  prettier,
];

export default config;
