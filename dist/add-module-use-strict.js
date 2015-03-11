"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var builders = require("recast").types.builders;

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
var addModuleUseStrictVisitor = {
	/**
  * @param {NodePath} literalNodePath - Literal NodePath.
  */
	visitLiteral: function visitLiteral(literalNodePath) {
		if (literalNodePath.node.value === "use strict") {
			literalNodePath.prune();
		}

		this.traverse(literalNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		var useStrictStatement = builders.expressionStatement(builders.literal("use strict"));

		programNodePath.get("body").unshift(useStrictStatement);
	}
};
exports.addModuleUseStrictVisitor = addModuleUseStrictVisitor;