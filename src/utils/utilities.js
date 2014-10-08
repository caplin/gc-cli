var Sequence = require('immutable').Sequence;
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;

/**
 * Returns true if the provided Expression node is the root of a hierarchy of nodes that match the namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Sequence<string>} namespaceSequence - A sequence of names to match the expressionNode to.
 */
export function isNamespacedExpressionNode(expressionNode, namespaceSequence) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === namespaceSequence.first() && namespaceSequence.count() === 1;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		return namedTypes.Identifier.check(expressionNode.property)
			&& expressionNode.property.name === namespaceSequence.first()
			&& isNamespacedExpressionNode(expressionNode.object, namespaceSequence.skip(1));
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
	var freeVarName = varName;
	var referencesWithSameName = 1;

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
	var requireCall = builders.callExpression(
		builders.identifier('require'),	[builders.literal(importedModule)]
	);
	var importDeclaration = builders.variableDeclaration(
		'var', [builders.variableDeclarator(moduleIdentifier, requireCall)]
	);

	return importDeclaration;
}
