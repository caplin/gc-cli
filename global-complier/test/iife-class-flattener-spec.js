import {equal} from 'assert';
import {readFileSync} from 'fs';

import {describe, it} from 'mocha';
import {parse, print, visit} from 'recast';

import {iifeClassFlattenerVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/iife-class-flattener/';

const givenCode = readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

const givenTwoLevelCode = readFileSync(testResourcesLocation + 'given-twolevel.js', fileOptions);
const expectedTwoLevelCode = readFileSync(testResourcesLocation + 'expected-twolevel.js', fileOptions);
const givenTwoLevelAST = parse(givenTwoLevelCode);

describe('IIFE Namespaced class flattening', () => {
	it('should extract class from IIFE.', () => {
		// Given.
		iifeClassFlattenerVisitor.initialize('my.long.name.space.SimpleClass');

		// When.
		visit(givenAST, iifeClassFlattenerVisitor);

		// Then.
		equal(print(givenAST).code, expectedCode);
	});

	it('should extract class from IIFE with only two levels.', () => {
		// Given.
		iifeClassFlattenerVisitor.initialize('my.Class');

		// When.
		visit(givenTwoLevelAST, iifeClassFlattenerVisitor);

		// Then.
		equal(print(givenTwoLevelAST).code, expectedTwoLevelCode);
	});
});
