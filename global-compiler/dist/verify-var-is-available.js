"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var calculateUniqueModuleVariableId = require("./utils/utilities").calculateUniqueModuleVariableId;

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
 * Will find a free variation of a variable name for use within a module AST.
 */
var verifyVarIsAvailableVisitor = {
	initialize: function initialize() {
		this._identifiersInModuleScope = new Set();
	},

	/**
  * Will return a variation on a variable name is free to use inside the module scope.
  *
  * @param {string} varName - variable name seed to search for a variation.
  * @returns {string} a unique variable name for the module.
  */
	getFreeVariation: function getFreeVariation(varName) {
		return calculateUniqueModuleVariableId(varName, this._identifiersInModuleScope);
	},

	/**
  * @param {NodePath} functionDeclarationNodePath - Function Declaration NodePath.
  */
	visitFunctionDeclaration: function visitFunctionDeclaration(functionDeclarationNodePath) {
		this._identifiersInModuleScope.add(functionDeclarationNodePath.node.id.name);

		this.traverse(functionDeclarationNodePath);
	},

	/**
  * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
  */
	visitVariableDeclarator: function visitVariableDeclarator(variableDeclaratorNodePath) {
		this._identifiersInModuleScope.add(variableDeclaratorNodePath.node.id.name);

		this.traverse(variableDeclaratorNodePath);
	}
};
exports.verifyVarIsAvailableVisitor = verifyVarIsAvailableVisitor;