'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

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
var expected = fs.readFileSync('expected/expected.js', {encoding: 'utf-8'});
var expectedIIFE = fs.readFileSync('expected/expected-iife.js', {encoding: 'utf-8'});

System.config({
	map: {
		'global-compiler': 'node_modules/global-compiler/index'
	}
});

describe('GlobalCompiler conversion', function() {
	it('should convert namespaced code into CJS.', function(done) {
		System.import('../src/index')
			.then(shouldConvertNamespacedCode.bind(null, done))
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
		var output = fs.readFileSync('output/my/long/name/space/SimpleClass.js', {encoding: 'utf-8'});
		var outputIIFE = fs.readFileSync('output/my/long/name/space/SimpleIIFEClass.js', {encoding: 'utf-8'});

		assert.equal(output, expected);
		assert.equal(outputIIFE, expectedIIFE);

		done();
	}, 500);
}
