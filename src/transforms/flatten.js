import {builders} from 'ast-types';

/**
 * @param {AstNode} programNode - Program AstNode.
 * @param {string} fullyQualifiedName - The fully qualified class name.
 */
export function flattenNamespace(programNode, fullyQualifiedName) {
	fullyQualifiedName = fullyQualifiedName.split('.');

	programNode.body = programNode.body.map((programStatement) => {
		var {type, expression} = programStatement;

		if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
			return flattenIfNamespaced(programStatement, fullyQualifiedName);
		}

		return programStatement;
	});
}

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * Modify the provided ExpressionStatement AstNode if it's a namespaced node.
 * The node will have it's namespace removed.
 *
 * @param {AstNode} expressionStatement - ExpressionStatement AstNode.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 */
function flattenIfNamespaced(expressionStatement, fullyQualifiedName) {
	var {expression} = expressionStatement;
	var className = fullyQualifiedName[fullyQualifiedName.length - 1];

	if (isNamespacedConstructorMemberExpression(expression.left, fullyQualifiedName)) {
		return createConstructorFunctionDeclaration(expressionStatement, className);
	} else if (true) {
		flattenClassMethod(expression, className, 'myMethod');
	}

	return expressionStatement;
}

/**
 * Returns true if provided node is a namespaced class constructor.
 *
 * @param {AstNode} assignmentLeftExpression - Node to test.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @returns {boolean} is node a class constructor node.
 */
function isNamespacedConstructorMemberExpression(assignmentLeftExpression, fullyQualifiedName) {
	return fullyQualifiedName.reduceRight(isNamespacedClassConstructor, assignmentLeftExpression);
}

/**
 * @param {(AstNode|boolean)} expression - An Expression Node or a boolean.
 * @param {string} namespacePart - The part of the namespace to test.
 * @returns {(AstNode|boolean)} is node a class constructor node or next Expression AstNode to test.
 */
function isNamespacedClassConstructor(expression, namespacePart) {
	if (typeof expression === 'boolean') {
		return false;
	} else if (expression.type === 'Identifier' && expression.name === namespacePart) {
		return true;
	} else if (expression.type === 'MemberExpression' && expression.property.name === namespacePart) {
		return expression.object;
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
	var {expression: {right: functionExpression}} = expressionStatement;
	var classConstructorDeclaration = builders.functionDeclaration(
		builders.identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	return classConstructorDeclaration;
}

/**
 * Remove the namespace identifiers in a namespaced class method.
 *
 * @param {AstNode} assignmentExpression - Node to flatten.
 * @param {string} className - The class name.
 * @param {string} methodName - The method name.
 */
function flattenClassMethod(assignmentExpression, className, methodName) {
	var classProto = builders.memberExpression(
		builders.identifier(className),
		builders.identifier('prototype'),
		false
	);
	var classMethod = builders.memberExpression(
		classProto,
		builders.identifier(methodName),
		false
	);

	assignmentExpression.left = classMethod;
}