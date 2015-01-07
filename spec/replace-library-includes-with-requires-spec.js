const fs = require('fs');
const assert = require('assert');

const {Iterable} = require('immutable');
const {parse, print, visit} = require('recast');
import {replaceLibraryIncludesWithRequiresVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/replace-library-includes-with-requires/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('replace library includes with requires', function() {
	it('should remove library includes and add requires.', function() {
		//Given.
		const moduleIDsToRequire = new Set(['libraryplugin']);
		const libraryIncludeIterable = Iterable(['my', 'libraryinclude']);

		replaceLibraryIncludesWithRequiresVisitor.initialize(moduleIDsToRequire, libraryIncludeIterable);

		//When.
		visit(givenAST, replaceLibraryIncludesWithRequiresVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
