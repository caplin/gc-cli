const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {moduleIdVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/module-id-converter/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Module ID converter', function() {
	it('should transform specified module IDs.', function() {
		//Given.
		const moduleIDsToConvert = new Map([['my', ['some/Core', 'newVarName']]]);

		moduleIdVisitor.initialize(moduleIDsToConvert);

		//When.
		visit(givenAST, moduleIdVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
