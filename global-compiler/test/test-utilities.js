import {equal} from 'assert';
import {readFileSync} from 'fs';

import {
	parse,
	print
} from 'recast';

const fileOptions = {
	encoding: 'utf-8'
};

function readTestResourceCode(spec, testResourceFileName) {
	const testResourcesLocation = `test/resources/${spec}/${testResourceFileName}.js`;

	return readFileSync(testResourcesLocation, fileOptions);
}

export function getAST(spec, testResourceFileName) {
	const givenCode = readTestResourceCode(spec, testResourceFileName);

	return parse(givenCode);
}

export function verifyASTIsAsExpected(spec, testResourceFileName, convertedAST) {
	const expectedCode = readTestResourceCode(spec, testResourceFileName);

	equal(print(convertedAST).code, expectedCode);
}
