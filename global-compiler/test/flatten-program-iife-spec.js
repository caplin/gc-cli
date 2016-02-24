import {describe, it} from 'mocha';
import {visit} from 'recast';

import {flattenProgramIIFEVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('Flatten program IIFE', function() {
	it('should flatten a program IIFE.', function() {
		// Given.
		const givenAST = getAST('flatten-program-iife', 'given');

		// When.
		visit(givenAST, flattenProgramIIFEVisitor);

		// Then.
		verifyASTIsAsExpected('flatten-program-iife', 'expected', givenAST);
	});
});
