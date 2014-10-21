const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {rootNamespaceVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/globaltocjs/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Global to CJS conversion', function() {
	it('should replace globals with CJS requires.', function() {
		//Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenAST.program.body, 'SimpleClass');

		//When.
		visit(givenAST, rootNamespaceVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
