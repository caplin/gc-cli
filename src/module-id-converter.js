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
 * Transforms all CJS module ids in the provided `moduleIdsToConvert` `Map` to their value in the `Map`.
 * It will also transform the module identifier name.
 */
export const moduleIdVisitor = {
	/**
	 * @param {Map<string, string>} moduleIdsToConvert - The module Ids to convert.
	 */
	initialize(moduleIdsToConvert) {
		this._moduleIdsToConvert = moduleIdsToConvert;
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		replaceModuleIdsToTransform(identifierNodePath.node, identifierNodePath.parent, this._moduleIdsToConvert);

		this.traverse(identifierNodePath);
	}
};

/**
 * Replace any module ids that match the module ids to transform.
 *
 * @param {AstNode} identifierNode - Identifier node.
 * @param {NodePath} identifierParentNodePath - Identifier parent NodePath.
 * @param {Map<string, string>} moduleIdsToConvert - The module Ids to convert.
 */
function replaceModuleIdsToTransform(identifierNode, identifierParentNodePath, moduleIdsToConvert) {
	const isRequire = (identifierNode.name === 'require');
	const isParentCallExpression = (namedTypes.CallExpression.check(identifierParentNodePath.node));

	if (isRequire && isParentCallExpression) {
		const moduleIdNodePath = identifierParentNodePath.get('arguments', 0);
		const isModuleIdToConvert = moduleIdsToConvert.has(moduleIdNodePath.node.value);
		const isRequireCall = identifierParentNodePath.get('callee').node === identifierNode;

		if (isRequireCall && isModuleIdToConvert) {
			const moduleData = moduleIdsToConvert.get(moduleIdNodePath.node.value);

			moduleIdNodePath.replace(builders.literal(moduleData[0]));
			identifierParentNodePath.parent.get('id').replace(builders.identifier(moduleData[1]));
		}
	}
}
