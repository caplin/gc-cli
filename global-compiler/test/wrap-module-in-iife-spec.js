const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {wrapModuleInIIFEVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/wrap-module-in-iife/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('wrap module in IIFE', () => {
	it('should wrap module contents in an IIFE.', () => {
		//When.
		visit(givenAST, wrapModuleInIIFEVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
