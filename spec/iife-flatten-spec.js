const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {namespacedIIFEClassVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/iife-flatten/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);
const givenTwoLevelCode = fs.readFileSync(testResourcesLocation + 'given-twolevel.js', fileOptions);
const expectedTwoLevelCode = fs.readFileSync(testResourcesLocation + 'expected-twolevel.js', fileOptions);
const givenTwoLevelAST = parse(givenTwoLevelCode);

describe('IIFE Namespaced class flattening', function() {
	it('should extract class from IIFE.', function() {
		//Given.
		namespacedIIFEClassVisitor.initialize('my.long.name.space.SimpleClass');

		//When.
		visit(givenAST, namespacedIIFEClassVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});

	it('should extract class from IIFE with only two levels.', function() {
		//Given.
		namespacedIIFEClassVisitor.initialize('my.Class');

		//When.
		visit(givenTwoLevelAST, namespacedIIFEClassVisitor);

		//Then.
		assert.equal(print(givenTwoLevelAST).code, expectedTwoLevelCode);
	});
});
