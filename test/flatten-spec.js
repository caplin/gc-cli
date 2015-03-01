const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {namespacedClassVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/flatten/';

const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

const givenObjectCode = fs.readFileSync(testResourcesLocation + 'given-object.js', fileOptions);
const expectedObjectCode = fs.readFileSync(testResourcesLocation + 'expected-object.js', fileOptions);
const givenObjectAST = parse(givenObjectCode);

const givenTwoLevelObjectCode = fs.readFileSync(testResourcesLocation + 'given-twolevel.js', fileOptions);
const expectedTwoLevelObjectCode = fs.readFileSync(testResourcesLocation + 'expected-twolevel.js', fileOptions);
const givenTwoLevelObjectAST = parse(givenTwoLevelObjectCode);

describe('Namespaced class flattening', function() {
	it('should remove the class namespace.', function() {
		//Given.
		namespacedClassVisitor.initialize('my.long.name.space.SimpleClass');

		//When.
		visit(givenAST, namespacedClassVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});

	it('should remove object namespacing.', function() {
		//Given.
		namespacedClassVisitor.initialize('my.long.name.space.SimpleObject');

		//When.
		visit(givenObjectAST, namespacedClassVisitor);

		//Then.
		assert.equal(print(givenObjectAST).code, expectedObjectCode);
	});

	it('should remove two level object namespacing.', function() {
		//Given.
		namespacedClassVisitor.initialize('my.SimpleUtilityObject');

		//When.
		visit(givenTwoLevelObjectAST, namespacedClassVisitor);

		//Then.
		assert.equal(print(givenTwoLevelObjectAST).code, expectedTwoLevelObjectCode);
	});
});
