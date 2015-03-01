const fs = require('fs');
const assert = require('assert');

const {parse, visit} = require('recast');

import {nodePathLocatorVisitor} from '../src/index';
import {
	or,
	literal,
	identifier,
	callExpression,
	composeMatchers,
	memberExpression,
	variableDeclarator
} from '../src/utils/matchers';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/node-path-locator/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given-requires.js', fileOptions);
const givenAST = parse(givenCode);

const literalMatcher = composeMatchers(
	literal('lib'),
	callExpression({'callee': identifier('require')}),
	variableDeclarator({'id': identifier('lib')})
);

const identifierMatcher = composeMatchers(
	identifier('lib'),
	or(memberExpression({property: identifier('extend')}), memberExpression({property: identifier('implement')})),
	callExpression()
);

describe('node path locator', function() {
	let actualMatches;
	function matchedNodesReceiver(matchedNodePaths) {
		actualMatches = matchedNodePaths;
	}

	it('should find matching require statements.', function() {
		//Given.
		const matchers = new Map();

		matchers.set('Literal', literalMatcher);
		matchers.set('Identifier', identifierMatcher);
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
