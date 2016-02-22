const {Iterable} = require('immutable');
const capitalize = require('capitalize');
const {builders, namedTypes} = require('recast').types;

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
		const isPropertyIdentifier = namedTypes.Identifier.check(expressionNode.property);
		const isIdentifierANamespaceLeaf = expressionNode.property.name === namespaceIterable.first();

		return isPropertyIdentifier && isIdentifierANamespaceLeaf &&
			isNamespacedExpressionNode(expressionNode.object, namespaceIterable.skip(1));
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
export function calculateUniqueModuleVariableId(varName, moduleIdentifiers, namespaceParts=[]) {
	let freeVarName = varName;
	let referencesWithSameName = 1;
	let namespacePartToPrepend = namespaceParts.length;

	while (moduleIdentifiers.has(freeVarName)) {
		if (namespacePartToPrepend > 0) {
			namespacePartToPrepend--;
			freeVarName = (capitalize(namespaceParts[namespacePartToPrepend]) + varName);
		} else {
			freeVarName = (varName + referencesWithSameName);
			referencesWithSameName++;
		}
	}

	return freeVarName;
}

/**
 * Creates a CJS require declaration e.g. 'var <modIden> = require("importedModule");'
 *
 * @param {AstNode} moduleIdentifier - The identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
export function createRequireDeclaration(moduleIdentifier, importedModule, importSpecifier) {
	const importedModuleSource = builders.literal(importedModule);
	const requireIdentifier = builders.identifier('require');
	const requireCall = builders.callExpression(requireIdentifier, [importedModuleSource]);

	if (importSpecifier) {
		const importSpecifierIdentifier = builders.identifier(importSpecifier);
		const requireMemberExpression = builders.memberExpression(requireCall, importSpecifierIdentifier, false);
		const requireVariableDeclarator = builders.variableDeclarator(moduleIdentifier, requireMemberExpression);

		return builders.variableDeclaration('var', [requireVariableDeclarator]);
	}

	if (moduleIdentifier) {
		const requireVariableDeclarator = builders.variableDeclarator(moduleIdentifier, requireCall);

		return builders.variableDeclaration('var', [requireVariableDeclarator]);
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
