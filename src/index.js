import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';
import {builders} from 'ast-types';

/**
 * @param {Array} options - List of options for compiler.
 */
export function compileFile([fileLocation]) {
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);
	var programStatements = ast.program.body;

	//TODO: Pass this in as argument.
	var namespace = ['my', 'long', 'name', 'space', 'SimpleClass'];

	for (var programStatement of programStatements) {
		flattenNamespacedJsClass(programStatement, namespace);
	}

	console.log(print(ast).code);
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
function flattenNamespacedJsClass({type, expression}, namespace) {
	if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
		if (isNamespacedConstructorMemberExpression(expression.left, namespace)) {
			flattenClassConstructor(expression, namespace);
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