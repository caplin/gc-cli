const assert = require('assert');

import {describe, it} from 'mocha';
const {parse, print, visit} = require('recast');
const {builders} = require('recast').types;

import {
	extractParent,
	extractProperties,
	composeTransformers
} from '../../src/utils/transformers';

const {literal, identifier} = builders;

const variableDeclaratorTransformer = composeTransformers(
	literal('newlib'),
	extractParent(),
	extractParent(),
	extractProperties('id'),
	identifier('newlib')
);

describe('transformers', function() {
	it('parent should return a parent NodePath when given a NodePath.', function() {
		// Given.
		const stubParent = {};
		const stubNodePath = {parent: stubParent};

		// When.
		const returnedNodePath = extractParent()(stubNodePath);

		// Then.
		assert.equal(returnedNodePath, stubParent);
	});

	it('extract should return a child NodePath when given a NodePath.', function() {
		// Given.
		const stubChildNodePath = {};
		const stubNodePath = {get: function(childName) {
			assert.equal(childName, 'test');

			return stubChildNodePath;
		}};

		// When.
		const returnedNodePath = extractProperties('test')(stubNodePath);

		// Then.
		assert.equal(returnedNodePath, stubChildNodePath);
	});

	it('composeTransformers should transform a NodePath.', function() {
		// Given.
		const ast = parse('var lib = require("lib")');

		// When.
		visit(ast, {
			visitLiteral(literalNodePath) {
				variableDeclaratorTransformer(literalNodePath);

				return false;
			}
		});

		// Then.
		const transformedCode = print(ast).code;
		const expectedTransformedCode = 'var newlib = require("newlib")';

		assert.equal(transformedCode, expectedTransformedCode);
	});
});
