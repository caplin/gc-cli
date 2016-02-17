"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var builders = require("recast").types.builders;
var namedTypes = require("recast").types.namedTypes;

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
 * Transforms all CJS module ids in the provided `moduleIdsToConvert` `Map` to their value in the `Map`.
 * It will also transform the module identifier name.
 */
var moduleIdVisitor = {
	/**
  * @param {Map<string, string>} moduleIdsToConvert - The module Ids to convert.
  */
	initialize: function initialize(moduleIdsToConvert) {
		this._moduleIdsToConvert = moduleIdsToConvert;
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		replaceModuleIdsToTransform(identifierNodePath.node, identifierNodePath.parent, this._moduleIdsToConvert);

		this.traverse(identifierNodePath);
	}
};

exports.moduleIdVisitor = moduleIdVisitor;
/**
 * Replace any module ids that match the module ids to transform.
 *
 * @param {AstNode} identifierNode - Identifier node.
 * @param {NodePath} identifierParentNodePath - Identifier parent NodePath.
 * @param {Map<string, string>} moduleIdsToConvert - The module Ids to convert.
 */
function replaceModuleIdsToTransform(identifierNode, identifierParentNodePath, moduleIdsToConvert) {
	var isRequire = identifierNode.name === "require";
	var isParentCallExpression = namedTypes.CallExpression.check(identifierParentNodePath.node);

	if (isRequire && isParentCallExpression) {
		var moduleIdNodePath = identifierParentNodePath.get("arguments", 0);
		var isModuleIdToConvert = moduleIdsToConvert.has(moduleIdNodePath.node.value);
		var isRequireCall = identifierParentNodePath.get("callee").node === identifierNode;

		if (isRequireCall && isModuleIdToConvert) {
			var moduleData = moduleIdsToConvert.get(moduleIdNodePath.node.value);

			moduleIdNodePath.replace(builders.literal(moduleData[0]));
			identifierParentNodePath.parent.get("id").replace(builders.identifier(moduleData[1]));
		}
	}
}