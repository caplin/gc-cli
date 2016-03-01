import {equal} from 'assert';
import {readFileSync} from 'fs';

import {parse, print, visit} from 'recast';

import {namespacedClassFlattenerVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/namespaced-class-flattener/';

const givenCode = readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

const givenObjectCode = readFileSync(testResourcesLocation + 'given-object.js', fileOptions);
const expectedObjectCode = readFileSync(testResourcesLocation + 'expected-object.js', fileOptions);
const givenObjectAST = parse(givenObjectCode);

const givenTwoLevelObjectCode = readFileSync(testResourcesLocation + 'given-twolevel.js', fileOptions);
const expectedTwoLevelObjectCode = readFileSync(testResourcesLocation + 'expected-twolevel.js', fileOptions);
const givenTwoLevelObjectAST = parse(givenTwoLevelObjectCode);

describe('Namespaced class flattening', () => {
	it('should remove the class namespace.', () => {
		// Given
		namespacedClassFlattenerVisitor.initialize('my.long.name.space.SimpleClass');

		// When
		visit(givenAST, namespacedClassFlattenerVisitor);

		// Then
		equal(print(givenAST).code.replace(new RegExp('\r\n', 'g'), '\n'), expectedCode);
	});

	it('should remove object namespacing.', () => {
		// Given
		namespacedClassFlattenerVisitor.initialize('my.long.name.space.SimpleObject');

		// When
		visit(givenObjectAST, namespacedClassFlattenerVisitor);

		// Then
		equal(print(givenObjectAST).code.replace(new RegExp('\r\n', 'g'), '\n'), expectedObjectCode);
	});

	it('should remove two level object namespacing.', () => {
		// Given
		namespacedClassFlattenerVisitor.initialize('my.SimpleUtilityObject');

		// When
		visit(givenTwoLevelObjectAST, namespacedClassFlattenerVisitor);

		// Then
		equal(print(givenTwoLevelObjectAST).code.replace(new RegExp('\r\n', 'g'), '\n'), expectedTwoLevelObjectCode);
	});
});
