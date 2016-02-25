import {visit} from 'recast';

import {wrapModuleInIIFEVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('wrap module in IIFE', () => {
	it('should wrap module contents in an IIFE.', () => {
		// Given.
		const givenAST = getAST('wrap-module-in-iife', 'given');

		// When.
		visit(givenAST, wrapModuleInIIFEVisitor);

		// Then.
		verifyASTIsAsExpected('wrap-module-in-iife', 'expected', givenAST);
	});

	it('should only wrap a module if it has contents.', () => {
		// Given.
		const givenAST = getAST('wrap-module-in-iife', 'given-comment');

		// When.
		visit(givenAST, wrapModuleInIIFEVisitor);

		// Then.
		verifyASTIsAsExpected('wrap-module-in-iife', 'expected-comment', givenAST);
	});
});
