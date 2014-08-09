import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';
import {visit} from 'ast-types';
var minimist = require('minimist');

import {flattenNamespace} from './transforms/flatten';
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
		var namespace = args.flatten;
		flattenNamespace(ast.program, namespace);
	} else if (args.rootnstocjs) {
		var rootNsVisitor = new RootNamespaceVisitor(args.rootnstocjs, ast.program.body);
		visit(ast.program, rootNsVisitor);
		rootNsVisitor.insertRequires();
	}

	return print(ast).code;
}
