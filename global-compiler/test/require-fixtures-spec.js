import {describe, it} from 'mocha';
import {visit} from 'recast';

import {requireFixturesVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('require fixtures', () => {
	it('should require fixtures', () => {
		// Given.
		const givenAST = getAST('require-fixtures', 'given');

		// When.
		visit(givenAST, requireFixturesVisitor);

		// Then.
		verifyASTIsAsExpected('require-fixtures', 'expected', givenAST);
	});
});
