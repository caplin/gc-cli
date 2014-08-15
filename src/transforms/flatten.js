var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;
var PathVisitor = require('ast-types').PathVisitor;

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
 */
export class NamespacedClassVisitor extends PathVisitor {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	constructor(fullyQualifiedName) {
		super();

		this._fullyQualifiedName = fullyQualifiedName.split('.');
		this._namespaceLength = this._fullyQualifiedName.length - 1;
		this._className = this._fullyQualifiedName[this._namespaceLength];
	}

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;
		var identifierNode = identifierNodePath.node;

		if (isNamespacedClassExpressionNode(parent.node, this._fullyQualifiedName, this._namespaceLength)) {
			var grandParent = parent.parent;

			if (namedTypes.CallExpression.check(grandParent.node)) {
				grandParent.get('arguments', parent.name).replace(identifierNode);
			} else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
				var constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, this._className);

				grandParent.parent.replace(constructorFunctionDeclaration);
			} else {
				identifierNodePath.parent.parent.get('object').replace(identifierNode);
			}
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * Returns true if the provided Expression node is the root of a hierarchy of nodes that match the namespaced class.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @param {number} positionToCheck - Index in fullyQualifiedName to check expressionNode against.
 */
function isNamespacedClassExpressionNode(expressionNode, fullyQualifiedName, positionToCheck) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === fullyQualifiedName[positionToCheck] && positionToCheck === 0;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		return namedTypes.Identifier.check(expressionNode.property)
				&& expressionNode.property.name === fullyQualifiedName[positionToCheck]
				&& isNamespacedClassExpressionNode(expressionNode.object, fullyQualifiedName, positionToCheck - 1);
	}

	return false;
}

/**
 * Given a class constructor ExpressionStatement AstNode create a FunctionDeclaration class constructor.
 *
 * @param {AstNode} expressionStatement - ExpressionStatement AstNode.
 * @param {string} className - The class name.
 */
function createConstructorFunctionDeclaration(expressionStatement, className) {
	var {right: functionExpression} = expressionStatement;
	var classConstructorDeclaration = builders.functionDeclaration(
		builders.identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	return classConstructorDeclaration;
}