const fs = require('fs');
const assert = require('assert');

const {parse, visit} = require('recast');

import {nodePathLocatorVisitor} from '../src/index';
import {
	orMatchers,
	literalMatcher,
	identifierMatcher,
	callExpressionMatcher,
	composeMatchers,
	memberExpressionMatcher,
	variableDeclaratorMatcher
} from '../src/utils/matchers';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/node-path-locator/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given-requires.js', fileOptions);
const givenAST = parse(givenCode);

const libLiteralMatcher = composeMatchers(
	literalMatcher('lib'),
	callExpressionMatcher({'callee': identifierMatcher('require')}),
	variableDeclaratorMatcher({'id': identifierMatcher('lib')})
);

const libIdentifierMatcher = composeMatchers(
	identifierMatcher('lib'),
	orMatchers(memberExpressionMatcher({property: identifierMatcher('extend')}), memberExpressionMatcher({property: identifierMatcher('implement')})),
	callExpressionMatcher()
);

describe('node path locator', function() {
	let actualMatches;
	function matchedNodesReceiver(matchedNodePaths) {
		actualMatches = matchedNodePaths;
	}

	it('should find matching require statements.', function() {
		//Given.
		const matchers = new Map();

		matchers.set('Literal', libLiteralMatcher);
		matchers.set('Identifier', libIdentifierMatcher);
		nodePathLocatorVisitor.initialize(matchedNodesReceiver, matchers);

		//When.
		visit(givenAST, nodePathLocatorVisitor);

		//Then.
		assert.equal(actualMatches.size, 2);
		assert(actualMatches.has('Literal'));
		assert(actualMatches.has('Identifier'));

		const matchedIdentifiers = actualMatches.get('Identifier');

		assert.equal(matchedIdentifiers.length, 2);
	});
});
