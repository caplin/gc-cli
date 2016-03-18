"format es6";

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const del = require('del');
const {parse, print} = require('recast');
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
const expected = fs.readFileSync(expectedDirectory + 'expected.js', fileOptions);
const expectedIIFE = fs.readFileSync(expectedDirectory + 'expected-iife.js', fileOptions);
const expectedTest = fs.readFileSync(expectedDirectory + 'expected-test.js', fileOptions);
const expectedStyleFile = fs.readFileSync(expectedDirectory + 'expected-js-style.txt', fileOptions);
const expectedTestStyleFile = fs.readFileSync(expectedDirectory + 'expected-testjs-style.txt', fileOptions);
const filesToCleanUp = ['output', 'test-output', '.js-style', path.join('tests', '.js-style')];

describe('GlobalCompiler conversion', () => {
	afterEach((done) => del(filesToCleanUp, (error) => done(error)));

	it('should convert namespaced code into CJS.', (done) => {
		//Given.
		var optionsObject = createOptionsObject(commandOptions);

		//When.
		processFile(optionsObject);

		//Then.
		setTimeout(() => {
			const testsStyleFileOutput = fs.readFileSync(path.join('tests', '.js-style'), fileOptions);
			const output = fs.readFileSync('output/my/long/name/space/SimpleClass.js', fileOptions);
			const outputIIFE = fs.readFileSync('output/my/long/name/space/SimpleIIFEClass.js', fileOptions);

			assert.equal(output.replace(new RegExp('\r\n', 'g'), '\n'), expected);
			assert.equal(outputIIFE.replace(new RegExp('\r\n', 'g'), '\n'), expectedIIFE);
			assert.equal(testsStyleFileOutput.replace(new RegExp('\r\n', 'g'), '\n'), expectedTestStyleFile);

			done();
		}, 500);
	});

	it('should convert namespaced tests into CJS.', (done) => {
		//Given.
		const optionsObject = createOptionsObject(testCommandOptions);

		//When.
		processFile(optionsObject);

		//Then.
		setTimeout(() => {
			const output = fs.readFileSync('test-output/test-unit/js-test-driver/tests/MyTest.js', fileOptions);

			assert.equal(output.replace(new RegExp('\r\n', 'g'), '\n'), expectedTest);

			done();
		}, 500);
	});
});
