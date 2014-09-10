var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;

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
 * Converts all Expressions under the specified root namespace.
 * They will be mutated to flat Identifiers along with newly inserted CJS require statements.
 */
export var rootNamespaceVisitor = {
	/**
	 * @param {string} rootNamespace - The root namespace.
	 * @param {AstNode[]} programStatements - Program body statements.
	 */
	initialize(rootNamespace, programStatements) {
		this._requiresToInsert = new Map();
		this._rootNamespace = rootNamespace;
		this._programStatements = programStatements;
	},

	/**
	 * @param {NodePath} newExpressionNodePath - NewExpression NodePath.
	 */
	visitNewExpression(newExpressionNodePath) {
		var newExpression = newExpressionNodePath.node;
		var expressionNamespace = getExpressionNamespace(newExpression.callee);

		if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
			var requireIdentifier = newExpression.callee.property.name;
			var importDeclaration = createRequireDeclaration(requireIdentifier, expressionNamespace);

			newExpression.callee = builders.identifier(requireIdentifier);
			this._requiresToInsert.set(expressionNamespace, importDeclaration);
		}

		this.traverse(newExpressionNodePath);
	},

	/**
	 * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
	 */
	visitCallExpression(callExpressionNodePath) {
		var callExpression = callExpressionNodePath.node;
		flattenCallExpressionArguments(callExpression.arguments, this._rootNamespace, this._requiresToInsert);

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		insertRequires(this._requiresToInsert, this._programStatements);
	}
}

/**
 * Concatenates the name values of nested MemberExpressions and Identifier.
 * If expression has no name value, like a literal, it returns an empty string.
 *
 * @param {AstNode} memberExpression - MemberExpression or Identifier AstNode.
 * @returns {String} namespace of expression or an empty string.
 */
function getExpressionNamespace(memberExpression) {
	if (namedTypes.Identifier.check(memberExpression)) {
		return memberExpression.name;
	} else if (namedTypes.MemberExpression.check(memberExpression)) {
		return getExpressionNamespace(memberExpression.object) + '.' + memberExpression.property.name;
	}

	return '';
}

/**
 * Creates a CJS require declaration e.g. 'var <reqIden> = require("importedModule");'
 *
 * @param {string} requireIdentifier - The name of the identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
function createRequireDeclaration(requireIdentifier, importedModule) {
	var requireCall = builders.callExpression(
		builders.identifier('require'),	[
			builders.literal(importedModule)
		]);
	var importDeclaration = builders.variableDeclaration('var', [
		builders.variableDeclarator(
			builders.identifier(requireIdentifier),
			requireCall
		)]);

	return importDeclaration;
}

/**
 * Modify the provided call arguments. The expressions will have their namespace removed.
 *
 * @param {AstNode[]} callArguments - Expression AstNodes.
 * @param {string} rootNamespace - The fully qualified name as an array.
 * @param {string} requiresToInsert - The class name.
 */
function flattenCallExpressionArguments(callArguments, rootNamespace, requiresToInsert) {
	callArguments.forEach((argumentExpression, argumentIndex) => {
		var expressionNamespace = getExpressionNamespace(argumentExpression);

		if (expressionNamespace.startsWith(rootNamespace + '.')) {
			var requireIdentifier = argumentExpression.property.name;
			var importDeclaration = createRequireDeclaration(requireIdentifier, expressionNamespace);

			callArguments[argumentIndex] = builders.identifier(requireIdentifier);
			requiresToInsert.set(expressionNamespace, importDeclaration);
		}
	});
}

/**
 * Called after visiting ast to insert module requires.
 */
function insertRequires(requiresToInsert, programStatements) {
	requiresToInsert.forEach((importDeclaration) => {
		programStatements.unshift(importDeclaration);
	});
}
