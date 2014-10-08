'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;
var Sequence = require('immutable').Sequence;

var given = fs.readFileSync('test/add-require-for-global-identifier/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/add-require-for-global-identifier/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Add require for global identifier', function() {
	it('adds require for specified identifiers.', function(done) {
		System.import('../index')
			.then(shouldAddRequiresForGlobalIdentifiers.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldAddRequiresForGlobalIdentifiers(done, transforms) {
	var identifiersToRequire = new Map([
		[Sequence(['globalLibrary']), 'globallibrary'],
		[Sequence(['aLibrary', '()', 'plugin']), 'a-library']
	]);
	//Given.
	var addRequireForGlobalIdentifierVisitor = transforms.addRequireForGlobalIdentifierVisitor;
	addRequireForGlobalIdentifierVisitor.initialize(identifiersToRequire, givenAst.program.body);

	//When.
	visit(givenAst, addRequireForGlobalIdentifierVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
