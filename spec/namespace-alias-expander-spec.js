const fs = require('fs');
const assert = require('assert');

const {Sequence} = require('immutable');
const {parse, print, visit} = require('recast');
import {namespaceAliasExpanderVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/namespace-alias-expander/';
const givenFile = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedFile = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenFile);

describe('namespace alias expander', function() {
	it('should namespace aliases with namespaces.', function() {
		//Given.
		namespaceAliasExpanderVisitor.initialize(['my']);

		//When.
		visit(givenAST, namespaceAliasExpanderVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedFile);
	});
});
