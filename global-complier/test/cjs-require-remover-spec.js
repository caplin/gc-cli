const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {cjsRequireRemoverVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/cjs-require-remover/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('CJS require remover', function() {
	it('should remove specified module ids.', function() {
		//Given.
		var requiresToRemove = new Set(['my']);
		cjsRequireRemoverVisitor.initialize(requiresToRemove);

		//When.
		visit(givenAST, cjsRequireRemoverVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
