"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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
 * @param {importSpecifier} importSpecifier - The import specifier of the require.
 * @returns {ASTNode} require declaration.
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

var capitalize = _interopRequire(require("capitalize"));

var types = require("recast").types;

var _types$builders = types.builders;
var callExpression = _types$builders.callExpression;
var identifier = _types$builders.identifier;
var literal = _types$builders.literal;
var memberExpression = _types$builders.memberExpression;
var variableDeclaration = _types$builders.variableDeclaration;
var variableDeclarator = _types$builders.variableDeclarator;
var _types$namedTypes = types.namedTypes;
var Identifier = _types$namedTypes.Identifier;
var MemberExpression = _types$namedTypes.MemberExpression;

function isNamespacedExpressionNode(_x, _x2) {
	var _left;

	var _again = true;

	_function: while (_again) {
		_again = false;
		var expressionNode = _x,
		    namespaceIterable = _x2;
		isPropertyIdentifier = isIdentifierANamespaceLeaf = undefined;

		if (Identifier.check(expressionNode)) {
			return expressionNode.name === namespaceIterable.first() && namespaceIterable.count() === 1;
		} else if (MemberExpression.check(expressionNode)) {
			var isPropertyIdentifier = Identifier.check(expressionNode.property);
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
	var importedModuleSource = literal(importedModule);
	var requireIdentifier = identifier("require");
	var requireCall = callExpression(requireIdentifier, [importedModuleSource]);

	if (importSpecifier) {
		var importSpecifierIdentifier = identifier(importSpecifier);
		var requireMemberExpression = memberExpression(requireCall, importSpecifierIdentifier, false);
		var requireVariableDeclarator = variableDeclarator(moduleIdentifier, requireMemberExpression);

		return variableDeclaration("var", [requireVariableDeclarator]);
	}

	if (moduleIdentifier) {
		var requireVariableDeclarator = variableDeclarator(moduleIdentifier, requireCall);

		return variableDeclaration("var", [requireVariableDeclarator]);
	}

	return requireCall;
}

function getNamespacePath(_x, _x2) {
	var _again = true;

	_function: while (_again) {
		_again = false;
		var namespaceExpressionNode = _x,
		    namespaceParts = _x2;

		if (Identifier.check(namespaceExpressionNode)) {
			namespaceParts.push(namespaceExpressionNode.name);
		} else if (MemberExpression.check(namespaceExpressionNode)) {
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
	// If both the bearer AST node and the receiver AST node have comments prepend to the receiver.
	if (bearerASTNode.comments && receiverASTNode.comments) {
		var _receiverASTNode$comments;

		(_receiverASTNode$comments = receiverASTNode.comments).unshift.apply(_receiverASTNode$comments, _toConsumableArray(bearerASTNode.comments));
	} else if (bearerASTNode.comments) {
		// If the bearer has comments and the receiver doesn't then we can just assign the comments.
		receiverASTNode.comments = bearerASTNode.comments;
	}
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

		if (Identifier.check(expressionNodePath.node)) {
			return namespaceRoots.indexOf(expressionNodePath.node.name) > -1;
		} else if (MemberExpression.check(expressionNodePath.node)) {
			_x = expressionNodePath.get("object");
			_x2 = namespaceRoots;
			_again = true;
			continue _function;
		}

		return false;
	}
}
function isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots) {
	var isVariableNameIdentifier = Identifier.check(varNameNodePath.node);
	var isVarValueNamespaced = varValueNodePath && isNamespacedExpression(varValueNodePath, namespaceRoots);

	return isVariableNameIdentifier && isVarValueNamespaced;
}