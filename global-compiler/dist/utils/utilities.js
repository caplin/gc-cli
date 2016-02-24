"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

/**
 * Returns true if the provided Expression node is a leaf node of a namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Iterable<string>} namespaceIterable - An Iterable of names to match the expressionNode to.
 * @returns {boolean} true if the node is a leaf namespace node.
 */
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
 * Copy over comments ASTNode values from one node to another.
 *
 * @param  {ASTNode} bearerASTNode
 * @param  {ASTNode} receiverASTNode
 */
exports.copyComments = copyComments;

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

function copyComments(bearerASTNode, receiverASTNode) {
	// If both the bearer AST node and the receiver AST node have comments prepend the comments to the receiver.
	if (bearerASTNode.comments && receiverASTNode.comments) {
		var _receiverASTNode$comments;

		(_receiverASTNode$comments = receiverASTNode.comments).unshift.apply(_receiverASTNode$comments, _toConsumableArray(bearerASTNode.comments));
	} else if (bearerASTNode.comments) {
		// If the bearer has comments and the receiver doesn't then we can just assign the comments.
		receiverASTNode.comments = bearerASTNode.comments;
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