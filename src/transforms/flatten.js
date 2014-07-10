import {builders} from 'ast-types';

/**
 * @param {AstNode} programNode - Program AstNode.
 * @param {string} fullyQualifiedName - The fully qualified name as an array.
 */
export function flattenNamespace({body: programStatements}, fullyQualifiedName) {
	fullyQualifiedName = fullyQualifiedName.split('.');

	for (var programStatement of programStatements) {
		flattenNamespacedJsClass(programStatement, fullyQualifiedName);
	}
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
function flattenNamespacedJsClass({type, expression}, fullyQualifiedName) {
	if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
		if (isNamespacedConstructorMemberExpression(expression.left, fullyQualifiedName)) {
			flattenClassConstructor(expression, fullyQualifiedName);
		}
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
	//SimpleClass space name long my
	fullyQualifiedName.reduceRight(isNamespacedClassConstructor, assignmentLeftExpression);
	return true;
}

/**
 * Remove the namespace identifiers in a namespaced class constructor.
 *
 * @param {AstNode} assignmentExpression - Node to flatten.
 * @param {string[]} fullyQualifiedName - The fully qualified name as an array.
 */
function flattenClassConstructor(assignmentExpression, fullyQualifiedName) {
	var className = fullyQualifiedName[fullyQualifiedName.length - 1];

	assignmentExpression.left = builders.identifier(className);
}

function isNamespacedClassConstructor() {
//"type": "MemberExpression",
//	
//	"object": is the child
//	
//	"property": {
//                        "type": "Identifier",
//                        "name": "SimpleClass"
//                    }
}