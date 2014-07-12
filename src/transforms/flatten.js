import {builders} from 'ast-types';

var classConstructor = null;

/**
 * @param {AstNode} programNode - Program AstNode.
 * @param {string} fullyQualifiedName - The fully qualified name as an array.
 */
export function flattenNamespace({body: programStatements}, fullyQualifiedName) {
	fullyQualifiedName = fullyQualifiedName.split('.');

	for (var programStatement of programStatements) {
		var {type, expression} = programStatement;

		if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
			flattenIfNamespacedExpressionStatement(programStatement, fullyQualifiedName);
		}
	}

	replaceConstructorExpressionWithDeclaration(programStatements);
}

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * Modify the provided AstNode if it's a namespaced Js node.
 * The namespaced node will simply have it's namespace removed.
 *
 * @param {AstNode} astNode - Program body AstNode.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 */
function flattenIfNamespacedExpressionStatement(programStatement, fullyQualifiedName) {
	var {expression} = programStatement;
	var className = fullyQualifiedName[fullyQualifiedName.length - 1];

	if (isNamespacedConstructorMemberExpression(expression.left, fullyQualifiedName)) {
		createConstructorFunctionDeclaration(programStatement, className);
	} else if (true) {
		flattenClassMethod(expression, className, 'myMethod');
	}
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
 * @returns {boolean} is node a class constructor node.
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
 */
function createConstructorFunctionDeclaration(programStatement, className) {
//	var functionExpression = expression.right;
	var {expression: {right: functionExpression}} = programStatement;
//	classConstructor

	var classConstructorDeclaration = builders.functionDeclaration(
		builders.identifier(className),
		functionExpression.params,
		functionExpression.body
	);

	classConstructor = {programStatement, classConstructorDeclaration};
}

/**
 * Remove the namespace identifiers in a namespaced class method.
 *
 * @param {AstNode} assignmentExpression - Node to flatten.
 * @param {string} className - The class name.
 * @param {string} methodName - The method name.
 */
function flattenClassMethod(assignmentExpression, className, methodName) {
	var classProto = builders.memberExpression(builders.identifier(className), builders.identifier('prototype'), false);

	assignmentExpression.left = builders.memberExpression(classProto, builders.identifier(methodName), false);
}

/**
 */
function replaceConstructorExpressionWithDeclaration(programStatements) {
	var {programStatement, classConstructorDeclaration} = classConstructor;
	console.log(programStatement);
	var classConstructorExpression = programStatements.indexOf(programStatement);

	if (classConstructorExpression > -1) {
		
	}
//	classConstructor = {programStatement, classConstructorDeclaration}
}