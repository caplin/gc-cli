'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;
var Sequence = require('immutable').Sequence;

var given = fs.readFileSync('test/replace-library-includes-with-requires/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/replace-library-includes-with-requires/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('replace library includes with requires', function() {
	it('should remove library includes and add requires.', function(done) {
		System.import('../index')
			.then(shouldReplaceLibraryIncludes.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldReplaceLibraryIncludes(done, transforms) {
	//Given.
	var moduleIDsToRequire = new Set(['libraryplugin']);
	var libraryIncludeSequence = Sequence.from(['my', 'libraryinclude']);
	var replaceLibraryIncludesWithRequiresVisitor = transforms.replaceLibraryIncludesWithRequiresVisitor;
	replaceLibraryIncludesWithRequiresVisitor.initialize(moduleIDsToRequire, libraryIncludeSequence);

	//When.
	visit(givenAst, replaceLibraryIncludesWithRequiresVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
