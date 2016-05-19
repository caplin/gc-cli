import { Iterable } from 'immutable';
import { types } from 'recast';

import { isNamespacedExpressionNode } from './utils/utilities';

const { builders: { identifier } } = types;

/**
 * Given member expression parts flatten all their occurences to the provided identifier.
 */
export const flattenMemberExpression = {

	/**
  * @param {string[]} memberExpressionParts - The parts of the member expression to flatten.
  * @param {string} replacementIdentifier - The name of the identifier to replace the flattened member expression.
  */
	initialize(memberExpressionParts, replacementIdentifier) {
		this._memberExpressionParts = Iterable(memberExpressionParts.reverse());
		this._replacementIdentifier = identifier(replacementIdentifier);
	},

	/**
  * @param {NodePath} memberExpressionNodePath - MemberExpression NodePath.
  */
	visitMemberExpression(memberExpressionNodePath) {
		if (isNamespacedExpressionNode(memberExpressionNodePath.node, this._memberExpressionParts)) {
			memberExpressionNodePath.replace(this._replacementIdentifier);
		}

		this.traverse(memberExpressionNodePath);
	}
};