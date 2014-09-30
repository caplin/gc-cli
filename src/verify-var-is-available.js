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

var varIsAvailable = true;

/**
 * Will verify that a variable name is available to use within a module AST.
 */
export var verifyVarIsAvailableVisitor = {
	/**
	 * @param {string} varName - The var identifier name to check.
	 */
	initialize(varName) {
		varIsAvailable = true;
		this._varName = varName;
	},

	/**
	 * @returns {boolean} true if after visiting AST variable is available.
	 */
	get varIsAvailable() {
		return varIsAvailable;
	},

	/**
	 * @param {NodePath} functionDeclarationNodePath - Function Declaration NodePath.
	 */
	visitFunctionDeclaration(functionDeclarationNodePath) {
		verifyVarNameIsAvailable(this._varName, functionDeclarationNodePath.node.id.name);

		this.traverse(functionDeclarationNodePath);
	},

	/**
	 * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
	 */
	visitVariableDeclarator(variableDeclaratorNodePath) {
		verifyVarNameIsAvailable(this._varName, variableDeclaratorNodePath.node.id.name);

		this.traverse(variableDeclaratorNodePath);
	}
}

/**
 * @param {string} varNameToCheck - The var name to check.
 * @param {string} declaratorName - The declarator name.
 */
function verifyVarNameIsAvailable(varNameToCheck, declaratorName) {
	if (declaratorName === varNameToCheck) {
		varIsAvailable = false;
	}
}
