'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/flatten/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/flatten/expected.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Namespaced class flattening', function() {
	it('should remove the class namespace.', function(done) {
		System.import('../index')
			.then(shouldRemoveClassNamespace.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function shouldRemoveClassNamespace(done, flattenModule) {
	//Given.
	var namespacedClassVisitor = flattenModule.namespacedClassVisitor;
	namespacedClassVisitor.initialize('my.long.name.space.SimpleClass');

	//When.
	visit(givenAst, namespacedClassVisitor);

	//Then.
	assert.equal(print(givenAst).code, expected);

	done();
}
