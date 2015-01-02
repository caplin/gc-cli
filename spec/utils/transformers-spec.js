const assert = require('assert');

//const {builders: {literal, identifier}} = require('ast-types');

import {
	parent
} from '../../src/utils/transformers';

//const variableDeclaratorTransformer = composeTransformers(
//	literal('newlib'),
//	parent(),
//	parent(),
//	extract('id'),
//	identifier('newlib')
//);

describe('transformers', function() {
	it('parent function should return a parent NodePath when given a NodePath.', function() {
		//Given.
		const stubParent = {};
		const stubNodePath = {parent: stubParent};

		//When.
		const returnedNodePath = parent()(stubNodePath);

		//Then.
		assert.equal(returnedNodePath, stubParent);
	});
});
