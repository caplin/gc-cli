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
 * This transform works by identifying class name expressions such as.
 *
 * my.name.space.MyClass = function(){};
 *
 * my.name.space.MyClass.protoype.myMethod = function(){};
 * 
 * And flattening them to
 *
 * function MyClass(){};
 *
 * MyClass.protoype.myMethod = function(){};
 */
export const namespacedClassFlattenerVisitor = {
	/**
	 * @param {string} fullyQualifiedName The fully qualified class name
	 */
	initialize(fullyQualifiedName) {
		const nameParts = fullyQualifiedName.split('.').reverse();

		this._namespaceList = List.of(...nameParts);
		this._className = this._namespaceList.first();
	},

	/**
	 * @param {NodePath} identifierNodePath Identifier NodePath
	 */
	visitIdentifier(identifierNodePath) {
		const {parent} = identifierNodePath;

		if (isClassNamespaceLeaf(identifierNodePath, parent, this._namespaceList)) {
			replaceClassNamespaceWithIdentifier(parent, identifierNodePath.node, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * Checks if identifier is the leaf of class namespaced expression. The leaf being the class name.
 *
 * @param {NodePath}     identifierNodePath       Identifier NodePath
 * @param {NodePath}     identifierParentNodePath Identifier parent NodePath
 * @param {List<string>} namespaceList            Fully qualified class name iterable
 * @returns {boolean}                             true if identifier is the class name
 */
function isClassNamespaceLeaf(identifierNodePath, identifierParentNodePath, namespaceList) {
	// Is the identifier being tested the class name identifier i.e. `MyClass`
	const isClassNamespaceLeaf = (identifierParentNodePath.get('property') === identifierNodePath);
	const isClassNamespace = isNamespacedExpressionNode(identifierParentNodePath.node, namespaceList);

	return isClassNamespace && isClassNamespaceLeaf;
}

/**
 * @param {NodePath} namespacedClassNodePath Leaf of the fully qualified namespaced NodePath
 * @param {AstNode}  classNameIdentifierNode Identifier AstNode
 * @param {string}   className               The class name
 */
function replaceClassNamespaceWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
	const grandParent = namespacedClassNodePath.parent;

	// Is the namespaced expression a class constructor
	if (AssignmentExpression.check(grandParent.node) && FunctionExpression.check(grandParent.node.right)) {
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
 * @param {AstNode} assignmentExpression AssignmentExpression AstNode
 * @param {string}  className            The class name
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
