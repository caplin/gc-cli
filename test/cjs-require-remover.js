'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;

var given = fs.readFileSync('test/cjs-require-remover/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/cjs-require-remover/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('CJS require remover', function() {
	it('should remove specified module ids.', function(done) {
		System.import('../index')
			.then(shouldRemoveRequiresForModuleIds.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldRemoveRequiresForModuleIds(done, transforms) {
	var requiresToRemove = new Set(['my']);
	//Given.
	var cjsRequireRemoverVisitor = transforms.cjsRequireRemoverVisitor;
	cjsRequireRemoverVisitor.initialize(requiresToRemove);

	//When.
	visit(givenAst, cjsRequireRemoverVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
