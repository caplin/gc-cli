import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';

import {flattenNamespace} from './transforms/flatten';

/**
 * @param {Array} options - List of options for compiler.
 */
export function compileFile([fileLocation, fullyQualifiedName]) {
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);

	flattenNamespace(ast.program);

	console.log(print(ast).code);
}
