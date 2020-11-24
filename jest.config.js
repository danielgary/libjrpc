// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = {
	roots: ['<rootDir>'],
	testMatch: ['**/?(*.)(spec|test).ts?(x)'],
	testPathIgnorePatterns: ['node_modules'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest'
	}
}
