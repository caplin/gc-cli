const fs = require('fs');
const assert = require('assert');

const {Sequence} = require('immutable');
const {parse, print, visit} = require('recast');
import {moduleIdVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/module-id-converter/';
const givenFile = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedFile = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenFile);

describe('Module ID converter', function() {
	it('should transform specified module IDs.', function() {
		//Given.
		const moduleIDsToConvert = new Map([['my', ['some/Core', 'newVarName']]]);

		moduleIdVisitor.initialize(moduleIDsToConvert);

		//When.
		visit(givenAST, moduleIdVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedFile);
	});
});
