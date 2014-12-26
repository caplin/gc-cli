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

describe('node path locator', function() {
	it('should find matching require statements.', function() {
		//Given.
		let actualMatches;
		const matchers = new Map();
		const matcher = composeMatchers(
			literal('lib'),
			callExpression({'callee': identifier('require')}),
			variableDeclarator({'id': identifier('lib')})
		);
		function matchedNodesReceiver(matchedNodePaths) {
			actualMatches = matchedNodePaths;
		}

		matchers.set('Literal', matcher);
		nodePathLocatorVisitor.initialize(matchedNodesReceiver, matchers);

		//When.
		visit(givenAST, nodePathLocatorVisitor);

		//Then.
		assert.equal(actualMatches.size, 1);
		assert(actualMatches.has('Literal'));
	});
});
