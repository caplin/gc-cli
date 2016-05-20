import {describe, it} from 'mocha';
import {visit} from 'recast';

import {removeRedundantRequiresVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('remove redundant require call', () => {
	it('should remove redundant require call.', () => {
		// Given.
		const givenAST = getAST('remove-redundant-requires', 'given');

		removeRedundantRequiresVisitor.initialize();

		// When.
		visit(givenAST, removeRedundantRequiresVisitor);

		// Then.
		verifyASTIsAsExpected('remove-redundant-requires', 'expected', givenAST);
	});
});
