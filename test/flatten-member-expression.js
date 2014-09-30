'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/flatten-member-expression/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/flatten-member-expression/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Flatten member expression', function() {
	it('should flatten all occurences of a member expression.', function(done) {
		System.import('../index')
			.then(shouldTransformModuleIds.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldTransformModuleIds(done, transforms) {
	//Given.
	var flattenMemberExpression = transforms.flattenMemberExpression;
	flattenMemberExpression.initialize(['some', 'call'], 'newcall');

	//When.
	visit(givenAst, flattenMemberExpression);

	//Then.
	var outputtedCode = print(givenAst).code;

	assert.equal(outputtedCode, expected);

	done();
}
