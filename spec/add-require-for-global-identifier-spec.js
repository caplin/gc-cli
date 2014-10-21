const fs = require('fs');
const assert = require('assert');

const {Sequence} = require('immutable');
const {parse, print, visit} = require('recast');
import {addRequireForGlobalIdentifierVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/add-require-for-global-identifier/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Add require for global identifier', function() {
	it('adds require for specified identifiers.', function() {
		//Given.
		var identifiersToRequire = new Map([
			[Sequence.from(['otherGlobal']), 'otherglobal'],
			[Sequence.from(['globalLibrary']), 'globallibrary'],
			[Sequence.from(['aLibrary', '()', 'plugin']), 'a-library']
		]);
		addRequireForGlobalIdentifierVisitor.initialize(identifiersToRequire, givenAST.program.body);

		//When.
		visit(givenAST, addRequireForGlobalIdentifierVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});
});
