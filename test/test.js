'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var del = require('del');
var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;

process.chdir('test');

var commandOptions = {
	_: [],
	r: 'my',
	o: './output',
	n: 'my,other',
	removeRequires: 'my',
	namespaces: 'my,other',
	outputDirectory: './output'
};
var testCommandOptions = {
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
var expected = fs.readFileSync('expected/expected.js', {encoding: 'utf-8'});
var expectedIIFE = fs.readFileSync('expected/expected-iife.js', {encoding: 'utf-8'});
var expectedTest = fs.readFileSync('expected/expected-test.js', {encoding: 'utf-8'});
var expectedStyleFile = fs.readFileSync('expected/expected-js-style.txt', {encoding: 'utf-8'});
var expectedTestStyleFile = fs.readFileSync('expected/expected-testjs-style.txt', {encoding: 'utf-8'});
var filesToCleanUp = ['output', 'test-output', '.js-style', path.join('tests', '.js-style')];

System.config({
	map: {
		'global-compiler': 'node_modules/global-compiler/index'
	}
});

describe('GlobalCompiler conversion', function() {
	beforeEach(function(done) {
		del(filesToCleanUp, function (error) {
			done(error);
		});
	});

	it('should convert namespaced code into CJS.', function(done) {
		System.import('../src/index')
			.then(shouldConvertNamespacedCode.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should convert namespaced tests into CJS.', function(done) {
		System.import('../src/index')
			.then(shouldConvertNamespacedTests.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldConvertNamespacedCode(done, cliModule) {
	//Given.
	var optionsObject = cliModule.createOptionsObject(commandOptions);

	//When.
	cliModule.processFile(optionsObject);

	//Then.
	setTimeout(function() {
		var styleFileOutput = fs.readFileSync('.js-style', {encoding: 'utf-8'});
		var testsStyleFileOutput = fs.readFileSync(path.join('tests', '.js-style'), {encoding: 'utf-8'});
		var output = fs.readFileSync('output/my/long/name/space/SimpleClass.js', {encoding: 'utf-8'});
		var outputIIFE = fs.readFileSync('output/my/long/name/space/SimpleIIFEClass.js', {encoding: 'utf-8'});

		assert.equal(output, expected);
		assert.equal(outputIIFE, expectedIIFE);
		assert.equal(styleFileOutput, expectedStyleFile);
		assert.equal(testsStyleFileOutput, expectedTestStyleFile);

		done();
	}, 500);
}

function shouldConvertNamespacedTests(done, cliModule) {
	//Given.
	var optionsObject = cliModule.createOptionsObject(testCommandOptions);

	//When.
	cliModule.processFile(optionsObject);

	//Then.
	setTimeout(function() {
		var output = fs.readFileSync('test-output/test-unit/js-test-driver/tests/MyTest.js', {encoding: 'utf-8'});

		assert.equal(output, expectedTest);

		done();
	}, 500);
}
