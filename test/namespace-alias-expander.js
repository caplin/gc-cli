'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;

var given = fs.readFileSync('test/namespace-alias-expander/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/namespace-alias-expander/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Namespace alias expander', function() {
	it('should namespace aliases with namespaces.', function(done) {
		System.import('../index')
			.then(shouldExpandNamespaceAliases.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldExpandNamespaceAliases(done, transforms) {
	//Given.
	var namespaceAliasExpanderVisitor = transforms.namespaceAliasExpanderVisitor;
	namespaceAliasExpanderVisitor.initialize(['my']);

	//When.
	visit(givenAst, namespaceAliasExpanderVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
