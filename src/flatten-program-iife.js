const namedTypes = require('ast-types').namedTypes;

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * AstTypes NodePath.
 *
 * @typedef {Object} NodePath
 * @property {AstNode} node - SpiderMonkey AST node.
 */

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

		const isGrandParentProgram = namedTypes.Program.check(grandParent.node);
		const isCalleeFunctionExpression = namedTypes.FunctionExpression.check(callee.node);

		if (isGrandParentProgram && isCalleeFunctionExpression) {
			const iifeBody = callee.get('body', 'body').value;

			callExpressionNodePath.parent.replace(...iifeBody);
		}

		this.traverse(callExpressionNodePath);
	}
}
