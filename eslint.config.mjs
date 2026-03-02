import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    prettier,
    {
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': 'warn',
            'prefer-const': 'warn',
            'no-var': 'error',
        },
    },
    {
        ignores: ['out/', '.next/', 'coverage/', 'node_modules/', 'next-env.d.ts', 'scripts/'],
    },
];

export default eslintConfig;
