var Sequence = require('immutable').Sequence;
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
 * Converts all Expression trees that match the provided fully qualified class name.
 * They will be mutated to flat Identifiers with the class name as their value.
 */
export class NamespacedClassVisitor extends PathVisitor {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	constructor(fullyQualifiedName) {
		super();

		this._namespaceSequence = Sequence(fullyQualifiedName.split('.').reverse());
		this._className = this._namespaceSequence.first();
	}

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		if (isNamespacedClassExpressionNode(parent.node, this._namespaceSequence)) {
			replaceNamespacedClassWithIdentifier(parent, identifierNodePath.node, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * Returns true if the provided Expression node is the root of a hierarchy of nodes that match the namespaced class.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Sequence} namespaceSequence - A sequence of names to match the expressionNode to.
 */
function isNamespacedClassExpressionNode(expressionNode, namespaceSequence) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === namespaceSequence.first() && namespaceSequence.count() === 1;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		var shortenedSequence = Sequence(namespaceSequence.skip(1).toArray());

		return namedTypes.Identifier.check(expressionNode.property)
			&& expressionNode.property.name === namespaceSequence.first()
			&& isNamespacedClassExpressionNode(expressionNode.object, shortenedSequence);
	}

	return false;
}

/**
 * @param {NodePath} namespacedClassNodePath - Root of the fully qualified namespaced NodePath.
 * @param {AstNode} classNameIdentifierNode - Identifier AstNode.
 * @param {string} className - The class name.
 */
function replaceNamespacedClassWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
	var grandParent = namespacedClassNodePath.parent;

	if (namedTypes.CallExpression.check(grandParent.node)) {
		grandParent.get('arguments', namespacedClassNodePath.name).replace(classNameIdentifierNode);
	} else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
		var constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, className);

		grandParent.parent.replace(constructorFunctionDeclaration);
	} else if (namedTypes.MemberExpression.check(grandParent.node)) {
		grandParent.get('object').replace(classNameIdentifierNode);
	} else {
		console.log('Namespaced class expression not transformed, grandparent node type ::', grandParent.node.type);
	}
}

/**
 * Given a class constructor AssignmentExpression AstNode create a FunctionDeclaration class constructor.
 *
 * @param {AstNode} assignmentExpression - AssignmentExpression AstNode.
 * @param {string} className - The class name.
 */
function createConstructorFunctionDeclaration(assignmentExpression, className) {
	var {right: functionExpression} = assignmentExpression;
	var classConstructorDeclaration = builders.functionDeclaration(
		builders.identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	return classConstructorDeclaration;
}