// jest.config.js
/** @type {import('jest').Config} */
const config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: [
		'**/__tests__/**/*.[jt]s?(x)',
		'**/?(*.)+(spec|test).[tj]s?(x)',
		'**/test_*.ts'
	],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	roots: ['<rootDir>'],
};

module.exports = config;