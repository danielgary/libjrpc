module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	extends: [
		'prettier/@typescript-eslint',
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
		'plugin:prettier/recommended'
	],

	plugins: ['@typescript-eslint', 'import', 'typescript-sort-keys'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module' // Allows for the use of imports
	},
	rules: {
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'import/no-anonymous-default-export': ['error'],
		'@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
		'typescript-sort-keys/string-enum': 'error',
		'@typescript-eslint/member-delimiter-style': [
			'warn',
			{
				multiline: {
					delimiter: 'comma',
					requireLast: false
				},
				singleline: {
					delimiter: 'comma',
					requireLast: false
				},
				overrides: {
					interface: {
						multiline: {
							delimiter: 'none',
							requireLast: false
						}
					},
					typeLiteral: {
						multiline: {
							delimiter: 'none',
							requireLast: false
						}
					}
				}
			}
		],
		'@typescript-eslint/camelcase': ['off'],
		'@typescript-eslint/interface-name-prefix': ['off'],
		'@typescript-eslint/explicit-function-return-type': ['error'],
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'no-var': 'error',
		'prettier/prettier': [
			'error',
			{
				extends: 'prettier.config.js'
			}
		],
		'no-unused-vars': 'error',
		'sort-imports': [
			'off',
			{
				ignoreCase: false,
				ignoreDeclarationSort: false,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single']
			}
		],
		'sort-keys': 'off',
		'sort-vars': 'off'
	},
	settings: {}
}
