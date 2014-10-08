'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;

var given = fs.readFileSync('test/globaltocjs/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/globaltocjs/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Global to CJS conversion', function() {
	it('should replace globals with CJS requires.', function(done) {
		System.import('../index')
			.then(shouldReplaceGlobalsWithRequires.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldReplaceGlobalsWithRequires(done, transforms) {
	//Given.
	var rootNamespaceVisitor = transforms.rootNamespaceVisitor;
	rootNamespaceVisitor.initialize(['my', 'other'], givenAst.program.body, 'SimpleClass');

	//When.
	visit(givenAst, rootNamespaceVisitor);

	//Then.
	var expectedCode = expected.replace(/\r/g, '');
	var outputtedCode = print(givenAst).code.replace(/\r/g, '');

	assert.equal(outputtedCode, expectedCode);

	done();
}
