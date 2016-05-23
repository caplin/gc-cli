import {describe, it} from 'mocha';
import {visit} from 'recast';

import {addInterfaceArgumentToEventHubVisitor} from '../src/index';
import {getAST, verifyASTIsAsExpected} from './test-utilities';

describe('Add interface argument to EventHub calls', () => {
	it('should add interface as last argument.', () => {
		// Given.
		const givenAST = getAST('add-interface-argument-to-eventhub', 'given');

		// When.
		visit(givenAST, addInterfaceArgumentToEventHubVisitor);

		// Then.
		verifyASTIsAsExpected('add-interface-argument-to-eventhub', 'expected', givenAST);
	});
});
