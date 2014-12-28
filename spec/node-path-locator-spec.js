const fs = require('fs');
const assert = require('assert');

const {parse, visit} = require('recast');

import {nodePathLocatorVisitor} from '../index';
import {
	literal,
	identifier,
	callExpression,
	composeMatchers,
	variableDeclarator
} from '../src/utils/matchers';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'spec/resources/node-path-locator/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given-requires.js', fileOptions);
const givenAST = parse(givenCode);

const literalMatcher = composeMatchers(
	literal('lib'),
	callExpression({'callee': identifier('require')}),
	variableDeclarator({'id': identifier('lib')})
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
		nodePathLocatorVisitor.initialize(matchedNodesReceiver, matchers);

		//When.
		visit(givenAST, nodePathLocatorVisitor);

		//Then.
		assert.equal(actualMatches.size, 1);
		assert(actualMatches.has('Literal'));
	});
});
