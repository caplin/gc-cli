import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';
module minimist from 'minimist';

import {flattenNamespace} from './transforms/flatten';

/**
 * @param {Array} options - List of options for compiler.
 */
export function compileFile(options) {
	var args = minimist(options);
	var fileLocation = args._[0];
	var namespace = args.flatten;
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);

	flattenNamespace(ast.program, namespace);

	console.log(print(ast).code);
	return print(ast).code;
}
