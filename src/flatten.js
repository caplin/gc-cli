import {types} from 'recast';
import {List} from 'immutable';

import {isNamespacedExpressionNode} from './utils/utilities';

const {
	namedTypes: {
		MemberExpression,
		FunctionExpression,
		AssignmentExpression
	},
	builders: {
		identifier,
		functionDeclaration
	}
} = types;

/**
 * Flattens all Expression trees that match the provided fully qualified class name. They will be
 * transformed to simple Identifiers with the class name as their value.
 *
 * This transform works by identifying class name expressions.
 *
 * my.name.space.MyClass = function(){};
 *
 */
export const namespacedClassFlattenerVisitor = {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	initialize(fullyQualifiedName) {
		const nameParts = fullyQualifiedName.split('.').reverse();

		this._namespaceList = List.of(...nameParts);
		this._className = this._namespaceList.first();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		const parent = identifierNodePath.parent;

		if (isClassNamespaceLeaf(identifierNodePath, parent, this._namespaceList)) {
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
 * @param {List<string>} namespaceList - Fully qualified class name iterable.
 * @returns {boolean} true if identifier is root of a class namespaced expression.
 */
function isClassNamespaceLeaf(identifierNodePath, identifierParentNodePath, namespaceList) {
	const isRootOfNamespace = (identifierParentNodePath.get('property') === identifierNodePath);
	const isInClassNamespace = isNamespacedExpressionNode(identifierParentNodePath.node, namespaceList);

	return isInClassNamespace && isRootOfNamespace;
}

/**
 * @param {NodePath} namespacedClassNodePath - Root of the fully qualified namespaced NodePath.
 * @param {AstNode} classNameIdentifierNode - Identifier AstNode.
 * @param {string} className - The class name.
 */
function replaceNamespacedClassWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
	const grandParent = namespacedClassNodePath.parent;

	if (AssignmentExpression.check(grandParent.node) &&
		FunctionExpression.check(grandParent.node.right)) {
		const constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, className);

		// Move the constructor comments onto the function declaration that replaces it
		constructorFunctionDeclaration.comments = grandParent.parent.node.comments;
		grandParent.parent.replace(constructorFunctionDeclaration);
	} else if (MemberExpression.check(namespacedClassNodePath.node)) {
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
	const classConstructorDeclaration = functionDeclaration(
		identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	return classConstructorDeclaration;
}
