import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';
import {builders} from 'ast-types';

/**
 * @param {Array} - List of options for compiler.
 */
export function compileFile([fileLocation]) {
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);
	var programStatements = ast.program.body;

	for (var programStatement of programStatements) {
		flattenNamespacedJsClass(programStatement);
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
 * @param {AstNode} - Program body AstNode.
 */
function flattenNamespacedJsClass(astNode) {
	if (astNode.type === 'ExpressionStatement') {
		var topLevelExpression = astNode.expression;

		if (topLevelExpression.type === 'AssignmentExpression') {
			topLevelExpression.left = builders.identifier("SimpleClass");
		}
	}
}

/**
 */
function flattenClassConstructor() {
	
}