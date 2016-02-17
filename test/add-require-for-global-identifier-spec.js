import {equal} from 'assert';
import {readFileSync} from 'fs';

import {Iterable} from 'immutable';
import {describe, it} from 'mocha';
import {parse, print, visit} from 'recast';

import {addRequireForGlobalIdentifierVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/add-require-for-global-identifier/';
const givenCode = readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

describe('Add require for global identifier', () => {
	it('adds require for specified identifiers.', () => {
		// Given
		const identifiersToRequire = new Map([
			[Iterable(['otherGlobal']), 'otherglobal'],
			[Iterable(['globalLibrary']), 'globallibrary'],
			[Iterable(['aLibrary', '()', 'plugin']), 'a-library']
		]);
		addRequireForGlobalIdentifierVisitor.initialize(identifiersToRequire, givenAST.program.body);

		// When
		visit(givenAST, addRequireForGlobalIdentifierVisitor);

		// Then
		equal(print(givenAST).code, expectedCode);
	});
});
