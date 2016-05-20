"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var _types$builders = types.builders;
var identifier = _types$builders.identifier;
var literal = _types$builders.literal;
var CallExpression = types.namedTypes.CallExpression;

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
	var isParentCallExpression = CallExpression.check(identifierParentNodePath.node);

	if (isRequire && isParentCallExpression) {
		var moduleIdNodePath = identifierParentNodePath.get("arguments", 0);
		var isModuleIdToConvert = moduleIdsToConvert.has(moduleIdNodePath.node.value);
		var isRequireCall = identifierParentNodePath.get("callee").node === identifierNode;

		if (isRequireCall && isModuleIdToConvert) {
			var moduleData = moduleIdsToConvert.get(moduleIdNodePath.node.value);

			moduleIdNodePath.replace(literal(moduleData[0]));
			identifierParentNodePath.parent.get("id").replace(identifier(moduleData[1]));
		}
	}
}