'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/iife-flatten/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/iife-flatten/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('IIFE Namespaced class flattening', function() {
	it('should extract class from IIFE.', function(done) {
		System.import('../index')
			.then(shouldExtractClassFromIIFE.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldExtractClassFromIIFE(done, compilerModule) {
	//Given.
	var namespacedIIFEClassVisitor = compilerModule.namespacedIIFEClassVisitor;
	namespacedIIFEClassVisitor.initialize('my.long.name.space.SimpleClass');

	//When.
	visit(givenAst, namespacedIIFEClassVisitor);

	//Then.
	var expectedCode = expected.replace(/\r/g, '');
	var outputtedCode = print(givenAst).code.replace(/\r/g, '');

	assert.equal(outputtedCode, expectedCode);

	done();
}
