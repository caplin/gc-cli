/* eslint-disable id-length */

import {equal} from 'assert';
import {readFileSync} from 'fs';
import {join} from 'path';

import del from 'del';
import {afterEach, describe, it} from 'mocha';
import {
	processFile,
	createOptionsObject
} from '../src/index';

const commandOptions = {
	_: [],
	r: 'my',
	o: './output',
	n: 'my,other,caplin',
	removeRequires: 'my',
	namespaces: 'my,other,caplin',
	outputDirectory: './output'
};
const testCommandOptions = {
	_: [],
	r: 'my',
	t: true,
	n: 'my,other',
	o: './test-output',
	removeRequires: 'my',
	compileTestFiles: true,
	namespaces: 'my,ct,other',
	outputDirectory: './test-output'
};

process.chdir('test/resources');

const expectedDirectory = 'expected/';
const fileOptions = {encoding: 'utf-8'};
const expected = readFileSync(`${expectedDirectory}expected.js`, fileOptions);
const expectedIIFE = readFileSync(`${expectedDirectory}expected-iife.js`, fileOptions);
const expectedTest = readFileSync(`${expectedDirectory}expected-test.js`, fileOptions);
const filesToCleanUp = ['output', 'test-output', '.js-style', join('tests', '.js-style')];

describe('GlobalCompiler conversion', () => {
	afterEach((done) => del(filesToCleanUp, (error) => done(error)));

	it('should convert namespaced code into CJS.', (done) => {
		// Given.
		const optionsObject = createOptionsObject(commandOptions);

		// When.
		processFile(optionsObject);

		// Then.
		setTimeout(() => {
			const output = readFileSync('output/my/long/name/space/SimpleClass.js', fileOptions);
			const outputIIFE = readFileSync('output/my/long/name/space/SimpleIIFEClass.js', fileOptions);

			equal(output, expected);
			equal(outputIIFE, expectedIIFE);

			done();
		}, 500);
	});

	it('should convert namespaced tests into CJS.', (done) => {
		// Given.
		const optionsObject = createOptionsObject(testCommandOptions);

		// When.
		processFile(optionsObject);

		// Then.
		setTimeout(() => {
			const output = readFileSync('test-output/test-unit/js-test-driver/tests/MyTest.js', fileOptions);

			equal(output, expectedTest);

			done();
		}, 500);
	});
});
