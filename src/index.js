import {join} from 'path';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';

export function compileFile([fileLocation]) {
	var filePath = join(process.cwd(), fileLocation);
	var fileContents = readFileSync(filePath);
	var ast = parse(fileContents);
	var programStatements = ast.program.body;

	for (var programStatement of programStatements) {
		t(programStatement);
//		console.log(programStatement);
	}

//	console.log(print(ast).code);
}

function t(astNode) {
	if (astNode.type === 'ExpressionStatement') {
		var topLevelExpression = astNode.expression;

		if (topLevelExpression.type === 'AssignmentExpression') {
			var memberExpression = topLevelExpression.left;

			console.log(memberExpression);
		}
	}
}