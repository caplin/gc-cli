const builders = require('ast-types').builders;
const namedTypes = require('ast-types').namedTypes;

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
export const cjsRequireRemoverVisitor = {
	/**
	 * @param {Set<string>} moduleIdsToRemove - The module requires to remove.
	 */
	initialize(moduleIdsToRemove) {
		this._moduleIdsToRemove = moduleIdsToRemove;
	},

	/**
	 * @param {NodePath} variableDeclarationNodePath - VariableDeclaration NodePath.
	 */
	visitVariableDeclaration(variableDeclarationNodePath) {
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
	const varDeclarations = variableDeclarationNodePath.get('declarations');
	const varDeclarator = varDeclarations.get(0);
	const varInit = varDeclarator.get('init');

	if (namedTypes.CallExpression.check(varInit.node)) {
		const varCallee = varInit.get('callee');
		const moduleIdNodePath = varInit.get('arguments', 0)

		const isRequireCall = varCallee.node.name === 'require';
		const hasOnlyOneVarDeclarator = varDeclarations.value.length === 1;
		const isModuleToRemove = moduleIdsToRemove.has(moduleIdNodePath.node.value);

		return isRequireCall && hasOnlyOneVarDeclarator && isModuleToRemove;
	}

	return false;
}
