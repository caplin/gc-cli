var join = require('path').join;
var readFileSync = require('fs').readFileSync;

var minimist = require('minimist');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;

import {NamespacedClassVisitor} from './transforms/flatten';
import {RootNamespaceVisitor} from './transforms/rootnstocjs';

/**
 * @param {Array} options - List of options for compiler.
 */
export function compileFile(options) {
	var args = minimist(options);
	var fileLocation = args._[0];
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);

	if (args.flatten) {
		var namespacedClassVisitor = new NamespacedClassVisitor(args.flatten);

		visit(ast.program, namespacedClassVisitor);
	} else if (args.rootnstocjs) {
		var rootNsVisitor = new RootNamespaceVisitor(args.rootnstocjs, ast.program.body);

		visit(ast.program, rootNsVisitor);
		rootNsVisitor.insertRequires();
	}

	return print(ast).code;
}
