import {describe, it} from 'mocha';
import {visit} from 'recast';

import {varNamespaceAliasExpanderVisitor} from '../src/index';
import {getAST, verifyASTIsAsExpected} from './test-utilities';

describe('var namespace alias expander', () => {
	it('should expand var namespace aliases to namespaces.', () => {
		// Given.
		const givenAST = getAST('var-namespace-alias-expander', 'given');

		varNamespaceAliasExpanderVisitor.initialize(['my']);

		// When.
		visit(givenAST, varNamespaceAliasExpanderVisitor);

		// Then.
		verifyASTIsAsExpected('var-namespace-alias-expander', 'expected', givenAST);
	});
});
