import {calculateUniqueModuleVariableId} from './utils/utilities';

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
export const verifyVarIsAvailableVisitor = {
	/**
	 * @param {string} varName - The var identifier name to check.
	 */
	initialize(varName) {
		this._identifiersInModuleScope = new Set();
	},

	/**
	 * Will return a variation on a variable name is free to use inside the module scope.
	 *
	 * @param {string} varName - variable name seed to search for a variation.
	 * @returns {string} a unique variable name for the module.
	 */
	getFreeVariation(varName) {
		return calculateUniqueModuleVariableId(varName, this._identifiersInModuleScope);
	},

	/**
	 * @param {NodePath} functionDeclarationNodePath - Function Declaration NodePath.
	 */
	visitFunctionDeclaration(functionDeclarationNodePath) {
		this._identifiersInModuleScope.add(functionDeclarationNodePath.node.id.name);

		this.traverse(functionDeclarationNodePath);
	},

	/**
	 * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
	 */
	visitVariableDeclarator(variableDeclaratorNodePath) {
		this._identifiersInModuleScope.add(variableDeclaratorNodePath.node.id.name);

		this.traverse(variableDeclaratorNodePath);
	}
}
