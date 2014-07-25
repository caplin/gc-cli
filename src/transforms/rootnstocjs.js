import {Visitor} from 'recast';
import {builders} from 'ast-types';

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * Converts all Expressions under the specified root namespace.
 * They will be mutated to flat Identifiers along with newly inserted CJS require statements.
 */
export class RootNamespaceVisitor extends Visitor {
	/**
	 * @param {string} rootNamespace - The root namespace.
	 * @param {AstNode[]} programStatements - Program body statements.
	 */
	constructor(rootNamespace, programStatements) {
		this._requiresToInsert = new Map();
		this._rootNamespace = rootNamespace;
		this._programStatements = programStatements;
	}

	/**
	 * @param {AstNode} newExpression - NewExpression AstNode.
	 */
	visitNewExpression(newExpression) {
		var expressionNamespace = getExpressionNamespace(newExpression.callee);

		if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
			var requireIdentifier = newExpression.callee.property.name;
			var importDeclaration = createRequireDeclaration(requireIdentifier, expressionNamespace);

			newExpression.callee = builders.identifier(requireIdentifier);
			this._requiresToInsert.set(expressionNamespace, importDeclaration);
		}

		this.genericVisit(newExpression);
	}

	/**
	 * @param {AstNode} callExpression - CallExpression AstNode.
	 */
	visitCallExpression(callExpression) {
		flattenCallExpressionArguments(callExpression.arguments, this._rootNamespace, this._requiresToInsert);

		this.genericVisit(callExpression);
	}

	/**
	 * Called after visiting ast to insert module requires.
	 */
	insertRequires() {
		this._requiresToInsert.forEach((importDeclaration) => {
			this._programStatements.unshift(importDeclaration);
		});
	}
}

/**
 * Concatenates the name values of nested MemberExpressions and Identifier.
 *
 * @param {AstNode} memberExpression - MemberExpression or Identifier AstNode.
 */
function getExpressionNamespace(memberExpression) {
	if (memberExpression.type === 'Identifier') {
		return memberExpression.name;
	} else if (memberExpression.type === 'MemberExpression') {
		return getExpressionNamespace(memberExpression.object) + '.' + memberExpression.property.name;
	}
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