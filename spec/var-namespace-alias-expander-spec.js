const fs = require('fs');
const assert = require('assert');

const {parse, print, visit} = require('recast');
import {varNamespaceAliasExpanderVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/var-namespace-alias-expander/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('var namespace alias expander', () => {
	it('should expand var namespace aliases to namespaces.', () => {
		//Given.
		varNamespaceAliasExpanderVisitor.initialize(['my']);

		//When.
		visit(givenAST, varNamespaceAliasExpanderVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
