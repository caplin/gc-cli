'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/module-id-converter/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/module-id-converter/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Module Id converter', function() {
	it('should transform specified module ids.', function(done) {
		System.import('../index')
			.then(shouldTransformModuleIds.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldTransformModuleIds(done, transforms) {
	var moduleIdsToConvert = new Map([['my', ['some/Core', 'newVarName']]]);
	//Given.
	var moduleIdVisitor = transforms.moduleIdVisitor;
	moduleIdVisitor.initialize(moduleIdsToConvert);

	//When.
	visit(givenAst, moduleIdVisitor);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
