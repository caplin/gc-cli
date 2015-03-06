const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {iifeClassFlattenerVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/iife-class-flattener/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);
const givenTwoLevelCode = fs.readFileSync(testResourcesLocation + 'given-twolevel.js', fileOptions);
const expectedTwoLevelCode = fs.readFileSync(testResourcesLocation + 'expected-twolevel.js', fileOptions);
const givenTwoLevelAST = parse(givenTwoLevelCode);

describe('IIFE Namespaced class flattening', function() {
	it('should extract class from IIFE.', function() {
		//Given.
		iifeClassFlattenerVisitor.initialize('my.long.name.space.SimpleClass');

		//When.
		visit(givenAST, iifeClassFlattenerVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});

	it('should extract class from IIFE with only two levels.', function() {
		//Given.
		iifeClassFlattenerVisitor.initialize('my.Class');

		//When.
		visit(givenTwoLevelAST, iifeClassFlattenerVisitor);

		//Then.
		assert.equal(print(givenTwoLevelAST).code, expectedTwoLevelCode);
	});
});
