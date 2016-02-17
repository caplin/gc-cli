const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {flattenMemberExpression} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/flatten-member-expression/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Flatten member expression', function() {
	it('should flatten all occurences of a member expression.', function() {
		//Given.
		flattenMemberExpression.initialize(['some', 'call'], 'newcall');

		//When.
		visit(givenAST, flattenMemberExpression);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
