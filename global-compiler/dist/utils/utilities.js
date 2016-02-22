

/**
 * Returns true if the provided Expression node is a leaf node of a namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Iterable<string>} namespaceIterable - An Iterable of names to match the expressionNode to.
 * @returns {boolean} true if the node is a leaf namespace node.
 */
"use strict";

exports.isNamespacedExpressionNode = isNamespacedExpressionNode;

/**
 * Generates a variable name that does not clash with already existing variable names in the module.
 *
 * @param {string} varName - variable name seed to search for a variation.
 * @param {Set<string>} moduleIdentifiers - all variable names declared in the module.
 * @returns {string} a unique variable name for the module.
 */
exports.calculateUniqueModuleVariableId = calculateUniqueModuleVariableId;

/**
 * Creates a CJS require declaration e.g. 'var <modIden> = require("importedModule");'
 *
 * @param {AstNode} moduleIdentifier - The identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
exports.createRequireDeclaration = createRequireDeclaration;

/**
 * Given a namespaced expression AST node it will return the parts for that node.
 *
 * @param {AstNode} namespaceExpressionNode - AST node part of namespaced expression.
 * @param {string[]} namespaceParts - used to build up the labels that make up a fully qualified namespace.
 * @returns {string[]} the labels that make up a fully qualified namespace.
 */
exports.getNamespacePath = getNamespacePath;

/**
 * Checks if variable parts make up a namespace alias.
 *
 * @param {NodePath} varNameNodePath - a variable name NodePath.
 * @param {(NodePath|null)} varValueNodePath - a variable value NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if variable parts are a namespace alias.
 */
exports.isNamespaceAlias = isNamespaceAlias;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var _require = require("immutable");

var Iterable = _require.Iterable;

var capitalize = require("capitalize");

var _require$types = require("recast").types;

var builders = _require$types.builders;
var namedTypes = _require$types.namedTypes;

function isNamespacedExpressionNode(_x, _x2) {
	var _left;

	var _again = true;

	_function: while (_again) {
		_again = false;
		var expressionNode = _x,
		    namespaceIterable = _x2;
		isPropertyIdentifier = isIdentifierANamespaceLeaf = undefined;

		if (namedTypes.Identifier.check(expressionNode)) {
			return expressionNode.name === namespaceIterable.first() && namespaceIterable.count() === 1;
		} else if (namedTypes.MemberExpression.check(expressionNode)) {
			var isPropertyIdentifier = namedTypes.Identifier.check(expressionNode.property);
			var isIdentifierANamespaceLeaf = expressionNode.property.name === namespaceIterable.first();

			if (!(_left = isPropertyIdentifier && isIdentifierANamespaceLeaf)) {
				return _left;
			}

			_x = expressionNode.object;
			_x2 = namespaceIterable.skip(1);
			_again = true;
			continue _function;
		}

		return false;
	}
}

function calculateUniqueModuleVariableId(varName, moduleIdentifiers) {
	var namespaceParts = arguments[2] === undefined ? [] : arguments[2];

	var freeVarName = varName;
	var referencesWithSameName = 1;
	var namespacePartToPrepend = namespaceParts.length;

	while (moduleIdentifiers.has(freeVarName)) {
		if (namespacePartToPrepend > 0) {
			namespacePartToPrepend--;
			freeVarName = capitalize(namespaceParts[namespacePartToPrepend]) + varName;
		} else {
			freeVarName = varName + referencesWithSameName;
			referencesWithSameName++;
		}
	}

	return freeVarName;
}

function createRequireDeclaration(moduleIdentifier, importedModule, importSpecifier) {
	var importedModuleSource = builders.literal(importedModule);
	var requireIdentifier = builders.identifier("require");
	var requireCall = builders.callExpression(requireIdentifier, [importedModuleSource]);

	if (importSpecifier) {
		var importSpecifierIdentifier = builders.identifier(importSpecifier);
		var requireMemberExpression = builders.memberExpression(requireCall, importSpecifierIdentifier, false);
		var requireVariableDeclarator = builders.variableDeclarator(moduleIdentifier, requireMemberExpression);

		return builders.variableDeclaration("var", [requireVariableDeclarator]);
	}

	if (moduleIdentifier) {
		var requireVariableDeclarator = builders.variableDeclarator(moduleIdentifier, requireCall);

		return builders.variableDeclaration("var", [requireVariableDeclarator]);
	}

	return requireCall;
}

function getNamespacePath(_x, _x2) {
	var _again = true;

	_function: while (_again) {
		_again = false;
		var namespaceExpressionNode = _x,
		    namespaceParts = _x2;

		if (namedTypes.Identifier.check(namespaceExpressionNode)) {
			namespaceParts.push(namespaceExpressionNode.name);
		} else if (namedTypes.MemberExpression.check(namespaceExpressionNode)) {
			namespaceParts.push(namespaceExpressionNode.property.name);
			_x = namespaceExpressionNode.object;
			_x2 = namespaceParts;
			_again = true;
			continue _function;
		}

		return namespaceParts;
	}
}

function isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots) {
	var isVariableNameIdentifier = namedTypes.Identifier.check(varNameNodePath.node);
	var isVarValueNamespaced = varValueNodePath && isNamespacedExpression(varValueNodePath, namespaceRoots);

	return isVariableNameIdentifier && isVarValueNamespaced;
}

/**
 * Checks if expression is rooted by an identifier with a namespace root name.
 *
 * @param {NodePath} expressionNodePath - NodePath to check.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if provided expression is part of namespace.
 */
function isNamespacedExpression(_x, _x2) {
	var _again = true;

	_function: while (_again) {
		_again = false;
		var expressionNodePath = _x,
		    namespaceRoots = _x2;

		if (namedTypes.Identifier.check(expressionNodePath.node)) {
			return namespaceRoots.indexOf(expressionNodePath.node.name) > -1;
		} else if (namedTypes.MemberExpression.check(expressionNodePath.node)) {
			_x = expressionNodePath.get("object");
			_x2 = namespaceRoots;
			_again = true;
			continue _function;
		}

		return false;
	}
}