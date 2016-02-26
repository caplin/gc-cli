import {types} from 'recast';

const {builders: {identifier, literal}, namedTypes: {CallExpression}} = types;

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
	const isParentCallExpression = CallExpression.check(identifierParentNodePath.node);

	if (isRequire && isParentCallExpression) {
		const moduleIdNodePath = identifierParentNodePath.get('arguments', 0);
		const isModuleIdToConvert = moduleIdsToConvert.has(moduleIdNodePath.node.value);
		const isRequireCall = identifierParentNodePath.get('callee').node === identifierNode;

		if (isRequireCall && isModuleIdToConvert) {
			const moduleData = moduleIdsToConvert.get(moduleIdNodePath.node.value);

			moduleIdNodePath.replace(literal(moduleData[0]));
			identifierParentNodePath
				.parent
				.get('id')
				.replace(identifier(moduleData[1]));
		}
	}
}
