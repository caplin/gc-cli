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
	 */
	constructor(rootNamespace) {
		this._rootNamespace = rootNamespace;
	}

	/**
	 * @param {AstNode} newExpression - NewExpression AstNode.
	 */
	visitNewExpression(newExpression) {
		//A NewExpression `callee` value going from a MemberExpression to an Identifier.
		setNewExpressionIdentifier(newExpression);

		this.genericVisit(newExpression);
	}
}

//Is it a MemberExpression with `object` value being an Identifier that equals the `_rootNamespace`

/**
 * @param {AstNode} newExpression - NewExpression AstNode.
 */
function setNewExpressionIdentifier(newExpression) {
	var {callee: {property: {name: identifierName}}} = newExpression;

	newExpression.callee = builders.identifier(identifierName);
}
