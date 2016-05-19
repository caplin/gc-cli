import { types } from 'recast';

import { copyComments } from './utils/utilities';

const { namedTypes: { Program, FunctionExpression } } = types;

/**
 * Removes all IIFEs at the Program level.
 * They will have their function lexical scope contents moved to the top module level.
 */
export const flattenProgramIIFEVisitor = {
	/**
  * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
  */
	visitCallExpression(callExpressionNodePath) {
		const callee = callExpressionNodePath.get('callee');
		const grandParent = callExpressionNodePath.parent.parent;
		const isGrandParentProgram = Program.check(grandParent.node);
		const isCalleeFunctionExpression = FunctionExpression.check(callee.node);

		if (isGrandParentProgram && isCalleeFunctionExpression) {
			const iifeBody = callee.get('body', 'body').value;

			copyComments(callExpressionNodePath.parentPath.node, iifeBody[0]);
			callExpressionNodePath.parent.replace(...iifeBody);
		}

		this.traverse(callExpressionNodePath);
	}
};