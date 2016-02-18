import {visit} from 'recast';

import {createRemoveClassNameClassExportVisitor} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('remove class name class export', function() {
	it('should remove class name class exports.', function() {
		// Given.
		const givenAST = getAST('remove-class-name-class-export', 'given');
		const removeNamespaceExportVisitor = createRemoveClassNameClassExportVisitor('caplin.chart.TestStudy');

		// When.
		visit(givenAST, removeNamespaceExportVisitor);

		// Then.
		verifyASTIsAsExpected('remove-class-name-class-export', 'expected', givenAST);
	});

	it('should remove, 4 part, class name class exports.', function() {
		// Given.
		const givenAST = getAST('remove-class-name-class-export', 'given-4part');
		const removeNamespaceExportVisitor = createRemoveClassNameClassExportVisitor('caplin.chart.my.TestStudy');

		// When.
		visit(givenAST, removeNamespaceExportVisitor);

		// Then.
		verifyASTIsAsExpected('remove-class-name-class-export', 'expected', givenAST);
	});
});
