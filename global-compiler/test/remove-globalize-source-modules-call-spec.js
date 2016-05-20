import {describe, it} from 'mocha';
import {visit} from 'recast';

import {createRemoveGlobalizeSourceModulesCallVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('remove globalizeSourceModules call', function() {
	it('should remove globalizeSourceModules call.', function() {
		// Given.
		const givenAST = getAST('remove-globalize-source-modules-call', 'given');
		const removeGlobalizeSourceModulesCallVisitor = createRemoveGlobalizeSourceModulesCallVisitor();

		// When.
		visit(givenAST, removeGlobalizeSourceModulesCallVisitor);

		// Then.
		verifyASTIsAsExpected('remove-globalize-source-modules-call', 'expected', givenAST);
	});
});
