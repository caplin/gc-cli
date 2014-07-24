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
		if (newExpression.callee.type === 'MemberExpression') {
			var expressionNamespace = getExpressionNamespace(newExpression.callee.object);

			if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
				var requireIdentifier = newExpression.callee.property.name;
				var importedModule = expressionNamespace + requireIdentifier;
				var importDeclaration = createRequireDeclaration(requireIdentifier, importedModule);

				setNewExpressionIdentifier(newExpression);
				this._requiresToInsert.set(importedModule, importDeclaration);
			}
		}

		this.genericVisit(newExpression);
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
 * @param {AstNode} memberExpression - MemberExpression or Identifier AstNode.
 */
function getExpressionNamespace(memberExpression) {
	if (memberExpression.type === 'Identifier') {
		return memberExpression.name + '.';
	}

	if (memberExpression.type === 'MemberExpression') {
		return getExpressionNamespace(memberExpression.object) + memberExpression.property.name + '.';
	}
}

/**
 * @param {AstNode} newExpression - NewExpression AstNode.
 */
function setNewExpressionIdentifier(newExpression) {
	var {callee: {property: {name: identifierName}}} = newExpression;

	newExpression.callee = builders.identifier(identifierName);
}

/**
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