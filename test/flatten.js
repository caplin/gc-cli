'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/flatten/given.js', {encoding: 'utf-8'});
var expected = fs.readFileSync('test/flatten/expected.js', {encoding: 'utf-8'});
var givenObject = fs.readFileSync('test/flatten/given-object.js', {encoding: 'utf-8'});
var expectedObject = fs.readFileSync('test/flatten/expected-object.js', {encoding: 'utf-8'});
var givenAst = parse(given);
var givenObjectAst = parse(givenObject);
var givenTwoLevelObject = fs.readFileSync('test/flatten/given-twolevel.js', {encoding: 'utf-8'});
var expectedTwoLevelObject = fs.readFileSync('test/flatten/expected-twolevel.js', {encoding: 'utf-8'});
var givenTwoLevelObjectAst = parse(givenTwoLevelObject);

describe('Namespaced class flattening', function() {
	it('should remove the class namespace.', function(done) {
		System.import('../index')
			.then(shouldRemoveClassNamespace.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should remove object namespacing.', function(done) {
		System.import('../index')
			.then(shouldRemoveObjectNamespace.bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should remove two level object namespacing.', function(done) {
		System.import('../index')
			.then(shouldRemoveTwoLevelObjectNamespace.bind(null, done))
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
	visit(givenAst.program, namespacedClassVisitor);

	//Then.
	var expectedCode = expected.replace(/\r/g, '');
	var outputtedCode = print(givenAst).code.replace(/\r/g, '');

	assert.equal(outputtedCode, expectedCode);

	done();
}

function shouldRemoveObjectNamespace(done, flattenModule) {
	//Given.
	var namespacedClassVisitor = flattenModule.namespacedClassVisitor;
	namespacedClassVisitor.initialize('my.long.name.space.SimpleObject');

	//When.
	visit(givenObjectAst.program, namespacedClassVisitor);

	//Then.
	var outputtedCode = print(givenObjectAst).code;

	assert.equal(outputtedCode, expectedObject);

	done();
}

function shouldRemoveTwoLevelObjectNamespace(done, flattenModule) {
	//Given.
	var namespacedClassVisitor = flattenModule.namespacedClassVisitor;
	namespacedClassVisitor.initialize('my.SimpleUtilityObject');

	//When.
	visit(givenTwoLevelObjectAst.program, namespacedClassVisitor);

	//Then.
	var outputtedCode = print(givenTwoLevelObjectAst).code;

	assert.equal(outputtedCode, expectedTwoLevelObject);

	done();
}
