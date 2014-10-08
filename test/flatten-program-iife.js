'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;

var given = fs.readFileSync('test/flatten-program-iife/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/flatten-program-iife/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Module Id converter', function() {
	it('should transform specified module ids.', function(done) {
		System.import('../index')
			.then(shouldFlattenProgramIIFEs.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldFlattenProgramIIFEs(done, transforms) {
	//Given.
	var flattenProgramIIFEVisitor = transforms.flattenProgramIIFEVisitor;

	//When.
	visit(givenAst, flattenProgramIIFEVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
