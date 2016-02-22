import {Iterable} from 'immutable';
import {describe, it} from 'mocha';
import {visit} from 'recast';

import {addRequireForGlobalIdentifierVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('Add require for global identifier', () => {
	it('adds require for specified identifiers.', () => {
		// Given
		const identifiersToRequire = new Map([
			[Iterable(['otherGlobal']), 'otherglobal'],
			[Iterable(['emitr']), 'emitr'],
			[Iterable(['globalLibrary']), 'globallibrary'],
			[Iterable(['aLibrary', '()', 'plugin']), 'a-library'],
			[Iterable(['SL4B_Accessor']), 'sl4bdummy->SL4B_Accessor']
		]);
		const givenAST = getAST('add-require-for-global-identifier', 'given');
		addRequireForGlobalIdentifierVisitor.initialize(identifiersToRequire, givenAST.program.body);

		// When
		visit(givenAST, addRequireForGlobalIdentifierVisitor);

		// Then
		verifyASTIsAsExpected('add-require-for-global-identifier', 'expected', givenAST);
	});
});
