import {describe, it} from 'mocha';
import {visit} from 'recast';

import {iifeClassFlattenerVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('IIFE Namespaced class flattening', () => {
	it('should extract class from IIFE.', () => {
		// Given.
		const givenAST = getAST('iife-class-flattener', 'given');
		iifeClassFlattenerVisitor.initialize('my.long.name.space.SimpleClass');

		// When.
		visit(givenAST, iifeClassFlattenerVisitor);

		// Then.
		verifyASTIsAsExpected('iife-class-flattener', 'expected', givenAST);
	});

	it('should extract class from IIFE with only two levels.', () => {
		// Given.
		const givenTwoLevelAST = getAST('iife-class-flattener', 'given-twolevel');
		iifeClassFlattenerVisitor.initialize('my.Class');

		// When.
		visit(givenTwoLevelAST, iifeClassFlattenerVisitor);

		// Then.
		verifyASTIsAsExpected('iife-class-flattener', 'expected-twolevel', givenTwoLevelAST);
	});
});
