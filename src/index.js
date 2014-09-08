var join = require('path').join;
var readFileSync = require('fs').readFileSync;

var parseArgs = require('minimist');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

import {namespacedClassVisitor} from './transforms/flatten';
import {rootNamespaceVisitor} from './transforms/rootnstocjs';

export {namespacedClassVisitor, rootNamespaceVisitor};

/**
 * @param {Array} options - List of options for compiler.
 */
export function compileFile(options) {
	var args = parseArgs(options);
	var fileLocation = args._[0];
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);

	if (args.flatten) {
		namespacedClassVisitor.initialize(args.flatten);

		visit(ast, namespacedClassVisitor);
	} else if (args.rootnstocjs) {
		rootNamespaceVisitor.initialize(args.rootnstocjs, ast.program.body);

		visit(ast, rootNamespaceVisitor);
	}

	return print(ast).code;
}
