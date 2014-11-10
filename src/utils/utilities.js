const {Iterable} = require('immutable');
const {builders, namedTypes} = require('ast-types');

/**
 * Returns true if the provided Expression node is a leaf node of a namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Iterable<string>} namespaceIterable - An Iterable of names to match the expressionNode to.
 * @returns {boolean} true if the node is a leaf namespace node.
 */
export function isNamespacedExpressionNode(expressionNode, namespaceIterable) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === namespaceIterable.first() && namespaceIterable.count() === 1;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		const shortenedIterable = Iterable(namespaceIterable.skip(1).toArray());
		const isPropertyIdentifier = namedTypes.Identifier.check(expressionNode.property);
		const isIdentifierANamespaceLeaf = expressionNode.property.name === namespaceIterable.first();

		return isPropertyIdentifier && isIdentifierANamespaceLeaf &&
			  isNamespacedExpressionNode(expressionNode.object, shortenedIterable);
	}

	return false;
}

/**
 * Generates a variable name that does not clash with already existing variable names in the module.
 *
 * @param {string} varName - variable name seed to search for a variation.
 * @param {Set<string>} moduleIdentifiers - all variable names declared in the module.
 * @returns {string} a unique variable name for the module.
 */
export function calculateUniqueModuleVariableId(varName, moduleIdentifiers) {
	let freeVarName = varName;
	let referencesWithSameName = 1;

	while (moduleIdentifiers.has(freeVarName)) {
		freeVarName = (varName + '__' + referencesWithSameName);
		referencesWithSameName++;
	}

	return freeVarName;
}

/**
 * Creates a CJS require declaration e.g. 'var <modIden> = require("importedModule");'
 *
 * @param {AstNode} moduleIdentifier - The identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
export function createRequireDeclaration(moduleIdentifier, importedModule) {
	const requireCall = builders.callExpression(
		builders.identifier('require'),	[builders.literal(importedModule)]
	);

	if (moduleIdentifier) {
		return builders.variableDeclaration(
			'var', [builders.variableDeclarator(moduleIdentifier, requireCall)]
		);
	}

	return requireCall;
}

/**
 * Given a namespaced expression AST node it will return the parts for that node.
 *
 * @param {AstNode} namespaceExpressionNode - AST node part of namespaced expression.
 * @param {string[]} namespaceParts - used to build up the labels that make up a fully qualified namespace.
 * @returns {string[]} the labels that make up a fully qualified namespace.
 */
export function getNamespacePath(namespaceExpressionNode, namespaceParts) {
	if (namedTypes.Identifier.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.name);
	} else if (namedTypes.MemberExpression.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.property.name);
		return getNamespacePath(namespaceExpressionNode.object, namespaceParts);
	}

	return namespaceParts;
}

/**
 * Checks if variable parts make up a namespace alias.
 *
 * @param {NodePath} varNameNodePath - a variable name NodePath.
 * @param {(NodePath|null)} varValueNodePath - a variable value NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if variable parts are a namespace alias.
 */
export function isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots) {
	const isVariableNameIdentifier = namedTypes.Identifier.check(varNameNodePath.node);
	const isVarValueNamespaced = varValueNodePath && isNamespacedExpression(varValueNodePath, namespaceRoots);

	return isVariableNameIdentifier && isVarValueNamespaced;
}

/**
 * Checks if expression is rooted by an identifier with a namespace root name.
 *
 * @param {NodePath} expressionNodePath - NodePath to check.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if provided expression is part of namespace.
 */
function isNamespacedExpression(expressionNodePath, namespaceRoots) {
	if (namedTypes.Identifier.check(expressionNodePath.node)) {
		return namespaceRoots.indexOf(expressionNodePath.node.name) > -1;
	} else if (namedTypes.MemberExpression.check(expressionNodePath.node)) {
		return isNamespacedExpression(expressionNodePath.get('object'), namespaceRoots);
	}

	return false;
}
