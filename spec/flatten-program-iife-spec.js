const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {flattenProgramIIFEVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/flatten-program-iife/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Flatten program IIFE', function() {
	it('should flatten a program IIFE.', function() {
		//When.
		visit(givenAST, flattenProgramIIFEVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
