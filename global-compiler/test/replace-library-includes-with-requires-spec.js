import {Iterable} from 'immutable';
import {describe, it} from 'mocha';
import {visit} from 'recast';

import {replaceLibraryIncludesWithRequiresVisitor} from '../src/index';
import {getAST, verifyASTIsAsExpected} from './test-utilities';

describe('replace library includes with requires', () => {
	it('should remove library includes and add requires.', () => {
		// Given.
		const givenAST = getAST('replace-library-includes-with-requires', 'given');
		const moduleIDsToRequire = new Set(['libraryPlugin']);
		const libraryIncludeIterable = Iterable(['my', 'libraryinclude']);

		replaceLibraryIncludesWithRequiresVisitor.initialize(moduleIDsToRequire, libraryIncludeIterable);

		// When.
		visit(givenAST, replaceLibraryIncludesWithRequiresVisitor);

		// Then.
		verifyASTIsAsExpected('replace-library-includes-with-requires', 'expected', givenAST);
	});
});
