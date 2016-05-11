import {describe, it} from 'mocha';
import {visit} from 'recast';

import {addAliasesRequiresVisitor} from '../src/index';
import {getAST, verifyASTIsAsExpected} from './test-utilities';

describe('Add aliases requires', () => {
	it('should add requires for discovered aliases.', () => {
		// Given.
		const availableAliases = new Set([
			'caplinps.collapsible-menu-model', 'caplin.grid-component'
		]);
		const givenAST = getAST('add-aliases-requires', 'given');

		addAliasesRequiresVisitor.initialize(availableAliases);

		// When.
		visit(givenAST, addAliasesRequiresVisitor);

		// Then.
		verifyASTIsAsExpected('add-aliases-requires', 'expected', givenAST);
	});
});
