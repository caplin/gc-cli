import {describe, it} from 'mocha';
import {visit} from 'recast';
import {getAST, verifyASTIsAsExpected} from './test-utilities';

import {namespacedClassFlattenerVisitor} from '../src/index';

describe('Namespaced class flattening', () => {
	it('should remove the class namespace.', () => {
		// Given
		const givenAST = getAST('namespaced-class-flattener', 'given');

		namespacedClassFlattenerVisitor.initialize('my.long.name.space.SimpleClass');

		// When
		visit(givenAST, namespacedClassFlattenerVisitor);

		// Then
		verifyASTIsAsExpected('namespaced-class-flattener', 'expected', givenAST);
	});

	it('should remove object namespacing.', () => {
		// Given
		const givenObjectAST = getAST('namespaced-class-flattener', 'given-object');

		namespacedClassFlattenerVisitor.initialize('my.long.name.space.SimpleObject');

		// When
		visit(givenObjectAST, namespacedClassFlattenerVisitor);

		// Then
		verifyASTIsAsExpected('namespaced-class-flattener', 'expected-object', givenObjectAST);
	});

	it('should remove two level object namespacing.', () => {
		// Given
		const givenTwoLevelObjectAST = getAST('namespaced-class-flattener', 'given-twolevel');

		namespacedClassFlattenerVisitor.initialize('my.SimpleUtilityObject');

		// When
		visit(givenTwoLevelObjectAST, namespacedClassFlattenerVisitor);

		// Then
		verifyASTIsAsExpected('namespaced-class-flattener', 'expected-twolevel', givenTwoLevelObjectAST);
	});

	it('should add var when flattening assignment expression with right member expression node.', () => {
		// Given
		const givenAssignmentAST = getAST('namespaced-class-flattener', 'given-assignment-expression');

		namespacedClassFlattenerVisitor.initialize('fxexecution.orderticket.MetalOrderTradeConstants');

		// When
		visit(givenAssignmentAST, namespacedClassFlattenerVisitor);

		// Then
		verifyASTIsAsExpected('namespaced-class-flattener', 'expected-assignment-expression', givenAssignmentAST);
	});
});
