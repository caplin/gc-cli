const assert = require('assert');

//const {builders: {literal, identifier}} = require('ast-types');

import {
	parent,
	extract
} from '../../src/utils/transformers';

//const variableDeclaratorTransformer = composeTransformers(
//	literal('newlib'),
//	parent(),
//	parent(),
//	extract('id'),
//	identifier('newlib')
//);

describe('transformers', function() {
	it('parent should return a parent NodePath when given a NodePath.', function() {
		//Given.
		const stubParent = {};
		const stubNodePath = {parent: stubParent};

		//When.
		const returnedNodePath = parent()(stubNodePath);

		//Then.
		assert.equal(returnedNodePath, stubParent);
	});

	it('extract should return a child NodePath when given a NodePath.', function() {
		//Given.
		const stubChildNodePath = {};
		const stubNodePath = {get: function(childName) {
			assert.equal(childName, 'test');

			return stubChildNodePath;
		}};

		//When.
		const returnedNodePath = extract('test')(stubNodePath);

		//Then.
		assert.equal(returnedNodePath, stubChildNodePath);
	});
});
