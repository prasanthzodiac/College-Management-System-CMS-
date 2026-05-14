import eslint from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['dist/**'] },
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	reactHooks.configs['recommended-latest'],
	reactRefresh.configs.vite,
	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'no-empty': ['error', { allowEmptyCatch: true }],
		},
	},
	{
		rules: {
			'react-hooks/exhaustive-deps': 'warn',
		},
	},
	eslintConfigPrettier,
)
