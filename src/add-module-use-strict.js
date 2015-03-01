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
 *
 */
export const addModuleUseStrictVisitor = {
	/**
	 * @param {NodePath} literalNodePath - Literal NodePath.
	 */
	visitLiteral(literalNodePath) {
		if (literalNodePath.node.value === 'use strict') {
			literalNodePath.prune();
		}

		this.traverse(literalNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		const useStrictStatement = builders.expressionStatement(builders.literal('use strict'));

		programNodePath.get('body').unshift(useStrictStatement);
	}
};
