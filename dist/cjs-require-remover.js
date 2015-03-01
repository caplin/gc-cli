"use strict";

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
 * Removes all CJS module ids in the provided `moduleIdsToRemove` `Set`.
 */
var cjsRequireRemoverVisitor = exports.cjsRequireRemoverVisitor = {
	/**
  * @param {Set<string>} moduleIdsToRemove - The module requires to remove.
  */
	initialize: function initialize(moduleIdsToRemove) {
		this._moduleIdsToRemove = moduleIdsToRemove;
	},

	/**
  * @param {NodePath} variableDeclarationNodePath - VariableDeclaration NodePath.
  */
	visitVariableDeclaration: function visitVariableDeclaration(variableDeclarationNodePath) {
		if (isARequireThatMustBeRemoved(variableDeclarationNodePath, this._moduleIdsToRemove)) {
			variableDeclarationNodePath.replace();
		}

		this.traverse(variableDeclarationNodePath);
	}
};

/**
 * Checks if the given Node Path is for a require statement that should be removed.
 *
 * @param {NodePath} variableDeclarationNodePath - VariableDeclaration NodePath.
 * @param {Set<string>} moduleIdsToRemove - The module require Ids to remove.
 */
function isARequireThatMustBeRemoved(variableDeclarationNodePath, moduleIdsToRemove) {
	var varDeclarations = variableDeclarationNodePath.get("declarations");
	var varDeclarator = varDeclarations.get(0);
	var varInit = varDeclarator.get("init");

	if (namedTypes.CallExpression.check(varInit.node)) {
		var varCallee = varInit.get("callee");
		var moduleIdNodePath = varInit.get("arguments", 0);

		var isRequireCall = varCallee.node.name === "require";
		var hasOnlyOneVarDeclarator = varDeclarations.value.length === 1;
		var isModuleToRemove = moduleIdsToRemove.has(moduleIdNodePath.node.value);

		return isRequireCall && hasOnlyOneVarDeclarator && isModuleToRemove;
	}

	return false;
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
