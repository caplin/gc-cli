const {Iterable} = require('immutable');
const builders = require('recast').types.builders;
const namedTypes = require('recast').types.namedTypes;

import {isNamespacedExpressionNode} from './utils/utilities';

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
export const namespacedClassVisitor = {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	initialize(fullyQualifiedName) {
		this._namespaceIterable = Iterable(fullyQualifiedName.split('.').reverse());
		this._className = this._namespaceIterable.first();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		const parent = identifierNodePath.parent;

		if (isClassNamespaceLeaf(identifierNodePath, parent, this._namespaceIterable)) {
			replaceNamespacedClassWithIdentifier(parent, identifierNodePath.node, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * Checks if identifier is the root of class namespaced expression.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @param {NodePath} identifierParentNodePath - Identifier parent NodePath.
 * @param {Iterable<string>} namespaceIterable - Fully qualified class name iterable.
 * @returns {boolean} true if identifier is root of a class namespaced expression.
 */
function isClassNamespaceLeaf(identifierNodePath, identifierParentNodePath, namespaceIterable) {
	const isRootOfNamespace = (identifierParentNodePath.get('property') === identifierNodePath);
	const isInClassNamespace = isNamespacedExpressionNode(identifierParentNodePath.node, namespaceIterable);

	return isInClassNamespace && isRootOfNamespace;
}

/**
 * @param {NodePath} namespacedClassNodePath - Root of the fully qualified namespaced NodePath.
 * @param {AstNode} classNameIdentifierNode - Identifier AstNode.
 * @param {string} className - The class name.
 */
function replaceNamespacedClassWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
	const grandParent = namespacedClassNodePath.parent;

	if (namedTypes.AssignmentExpression.check(grandParent.node) &&
		namedTypes.FunctionExpression.check(grandParent.node.right)) {
		const constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, className);

		// Move the constructor comments onto the function declaration that replaces it
		constructorFunctionDeclaration.comments = grandParent.parent.node.comments;
		grandParent.parent.replace(constructorFunctionDeclaration);
	} else if (namedTypes.MemberExpression.check(namespacedClassNodePath.node)) {
		namespacedClassNodePath.replace(classNameIdentifierNode);
	} else {
		console.log('Namespaced expression not transformed, grandparent node type ::', grandParent.node.type);
	}
}

/**
 * Given a class constructor AssignmentExpression AstNode create a FunctionDeclaration class constructor.
 *
 * @param {AstNode} assignmentExpression - AssignmentExpression AstNode.
 * @param {string} className - The class name.
 */
function createConstructorFunctionDeclaration(assignmentExpression, className) {
	const {right: functionExpression} = assignmentExpression;
	const classConstructorDeclaration = builders.functionDeclaration(
		builders.identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	return classConstructorDeclaration;
}
