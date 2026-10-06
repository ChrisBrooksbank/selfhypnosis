import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = [
    ...nextCoreWebVitals,
    ...nextTypescript,
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
        ignores: [
            'out/',
            '.next/',
            'coverage/',
            'node_modules/',
            'next-env.d.ts',
            'scripts/',
            'public/sw.js',
        ],
    },
];

export default eslintConfig;
