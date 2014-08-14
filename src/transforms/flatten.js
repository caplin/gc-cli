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
 * @param {AstNode} programNode - Program AstNode.
 * @param {string} fullyQualifiedName - The fully qualified class name.
 */
export function flattenNamespace(programNode, fullyQualifiedName) {
	fullyQualifiedName = fullyQualifiedName.split('.');

	programNode.body = programNode.body.map((programStatement) => {
		if (programStatement.type === 'ExpressionStatement') {
			return flattenExpressionStatement(programStatement, fullyQualifiedName);
		}

		return programStatement;
	});
}

/**
 * Flattens provided ExpressionStatement.
 *
 * @param {AstNode} programStatement - ExpressionStatement AstNode.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 */
function flattenExpressionStatement(programStatement, fullyQualifiedName) {
	var {expression} = programStatement;
	var className = fullyQualifiedName[fullyQualifiedName.length - 1];

	if (expression.type === 'AssignmentExpression') {
		return flattenAssignmentExpression(programStatement, fullyQualifiedName, className);
	} else if (expression.type === 'CallExpression') {
		flattenCallExpressionArguments(expression.arguments, fullyQualifiedName, className);
	}

	return programStatement;
}

/**
 * Modify the provided AssignmentExpression contained in an ExpressionStatement AstNode.
 * The node will have it's namespace removed.
 *
 * @param {AstNode} expressionStatement - ExpressionStatement AstNode.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @param {string} className - The class name.
 */
function flattenAssignmentExpression(expressionStatement, fullyQualifiedName, className) {
	var {expression: assignmentExpression} = expressionStatement;
	var assignmentLeftExpression = assignmentExpression.left;

	if (isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName)) {
		flattenClassMethod(assignmentExpression, className);
	} else if (isNamespacedExpression(assignmentLeftExpression, fullyQualifiedName)) {
		return createConstructorFunctionDeclaration(expressionStatement, className);
	}

	return expressionStatement;
}

/**
 * Returns true if provided node is a namespaced class method.
 *
 * @param {AstNode} assignmentLeftExpression - Node to test.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @returns {boolean} is node a class method.
 */
function isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName) {
	var fullyQualifiedMethod = Array
								.from(fullyQualifiedName)
								.concat('prototype', '*');

	return isNamespacedExpression(assignmentLeftExpression, fullyQualifiedMethod);
}

/**
 * Returns true if provided node is a namespaced class expression.
 *
 * @param {AstNode} assignmentLeftExpression - Node to test.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @returns {boolean} is node a class constructor.
 */
function isNamespacedExpression(assignmentLeftExpression, fullyQualifiedName) {
	return fullyQualifiedName.reduceRight(isNamespacedClassExpression, assignmentLeftExpression);
}

/**
 * @param {(AstNode|boolean)} expression - An Expression Node or a boolean.
 * @param {string} namespacePart - The part of the namespace to test.
 * @returns {(AstNode|boolean)} is node a class constructor node or next Expression AstNode to test.
 */
function isNamespacedClassExpression(expression, namespacePart) {
	if (typeof expression === 'boolean') {
		return false;
	} else if (expression.type === 'Identifier' && expression.name === namespacePart) {
		return true;
	} else if (expression.type === 'MemberExpression' && (expression.property.name === namespacePart || namespacePart === '*')) {
		return expression.object;
	}

	return false;
}

/**
 * Remove the namespace identifiers in a namespaced class method.
 *
 * @param {AstNode} assignmentExpression - Node to flatten.
 * @param {string} className - The class name.
 */
function flattenClassMethod(assignmentExpression, className) {
	var {left: {property: {name: methodName}}} = assignmentExpression;
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
 * Modify the provided call arguments. The expressions will have their namespace removed.
 *
 * @param {AstNode[]} callArguments - Expression AstNodes.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 * @param {string} className - The class name.
 */
function flattenCallExpressionArguments(callArguments, fullyQualifiedName, className) {
	callArguments.forEach((argumentExpression, argumentIndex) => {
		if (isNamespacedExpression(argumentExpression, fullyQualifiedName)) {
			callArguments[argumentIndex] = builders.identifier(className);
		}
	});
}




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
		this._className = this._fullyQualifiedName[this._fullyQualifiedName.length - 1];
	}

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;
		var identifierNode = identifierNodePath.node;

		//TODO: Improve check.
		if (identifierNode.name === this._className) {
			console.log(t(parent.node, this._fullyQualifiedName, this._fullyQualifiedName.length - 1));
	
			var grandParent = parent.parent;

			if (namedTypes.CallExpression.check(grandParent.node)) {
				grandParent.get('arguments', parent.name).replace(identifierNode);
			} else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
				grandParent.get(parent.name).replace(identifierNode);
//				console.log('***********', grandParent.parent.name);
			} else {
				identifierNodePath.parent.parent.get('object').replace(identifierNode);
			}
		}

		this.traverse(identifierNodePath);
	}
}

/**
 *
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Sequence} namespaceSequence - .
 */
function t(expressionNode, fullyQualifiedName, positionToCheck) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === fullyQualifiedName[positionToCheck] && positionToCheck === 0;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		return namedTypes.Identifier.check(expressionNode.property)
				&& expressionNode.property.name === fullyQualifiedName[positionToCheck]
				&& t(expressionNode.object, fullyQualifiedName, positionToCheck - 1);
	}

	return false;
}