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
		//A NewExpression `callee` value going from a MemberExpression to an Identifier.
		if (newExpression.callee.type === 'MemberExpression') {
			var expressionNamespace = getExpressionNamespace(newExpression.callee.object);

			if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
				var importedModule = expressionNamespace + newExpression.callee.property.name;

				console.log(importedModule);

				setNewExpressionIdentifier(newExpression);
			}
		}



		this.genericVisit(newExpression);
	}

	/**
	 * Called at the 
	 */
	insertRequires() {
		createRequireDeclaration(this._programStatements, 'Field', 'my.long.name.space.Field');
//	programStatements.unshift(...requiresToInsert.values());
	}
}

//Is it a MemberExpression with `object` value being an Identifier that equals the `_rootNamespace`

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

function createRequireDeclaration(programStatements, requiredIdentifier, importedModule) {
	var requireCall = builders.callExpression(
		builders.identifier('require'),	[
			builders.literal(importedModule)
		]);
	var importDeclaration = builders.variableDeclaration('var', [
		builders.variableDeclarator(
			builders.identifier(requiredIdentifier),
			requireCall
		)]);

	programStatements.unshift(importDeclaration);
}