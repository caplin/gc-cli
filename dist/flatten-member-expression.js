"use strict";

var _require = require("immutable");

var Iterable = _require.Iterable;

var builders = require("recast").types.builders;

var isNamespacedExpressionNode = require("./utils/utilities").isNamespacedExpressionNode;

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
 * Given the parts of a member expression flatten all occurences of it to the provided identifier.
 */
var flattenMemberExpression = exports.flattenMemberExpression = {
	/**
  * @param {string[]} memberExpressionParts - The parts of the member expression to flatten.
  * @param {string} replacementIdentifier - The name of the identifier to replace the flattened member expression.
  */
	initialize: function initialize(memberExpressionParts, replacementIdentifier) {
		this._memberExpressionParts = Iterable(memberExpressionParts.reverse());
		this._replacementIdentifier = builders.identifier(replacementIdentifier);
	},

	/**
  * @param {NodePath} memberExpressionNodePath - MemberExpression NodePath.
  */
	visitMemberExpression: function visitMemberExpression(memberExpressionNodePath) {
		if (isNamespacedExpressionNode(memberExpressionNodePath.node, this._memberExpressionParts)) {
			memberExpressionNodePath.replace(this._replacementIdentifier);
		}

		this.traverse(memberExpressionNodePath);
	}
};
Object.defineProperty(exports, "__esModule", {
	value: true
});
