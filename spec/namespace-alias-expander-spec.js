const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {namespaceAliasExpanderVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/namespace-alias-expander/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('namespace alias expander', function() {
	it('should namespace aliases with namespaces.', function() {
		//Given.
		namespaceAliasExpanderVisitor.initialize(['my']);

		//When.
		visit(givenAST, namespaceAliasExpanderVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
