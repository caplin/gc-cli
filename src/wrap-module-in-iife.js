const {builders} = require('recast').types;

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
 */
export const wrapModuleInIIFEVisitor = {
	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		const moduleBlockStatement = builders.blockStatement(programNodePath.node.body);
		const iife = builders.functionExpression(null, [], moduleBlockStatement);
		const iifeExpressionStatement = builders.expressionStatement(builders.callExpression(iife, []));

		programNodePath.get('body').replace([iifeExpressionStatement]);

		return false;
	}
};
