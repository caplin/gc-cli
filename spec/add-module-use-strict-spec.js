const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {addModuleUseStrictVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/add-module-use-strict/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Add module use strict', function() {
	it('should remove add a use strict as first module statement and remove any others.', function() {
		//When.
		visit(givenAST, addModuleUseStrictVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
