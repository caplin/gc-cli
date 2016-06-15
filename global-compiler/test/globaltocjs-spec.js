import {
	describe,
	it
} from 'mocha';
import {
	visit
} from 'recast';
import {
	rootNamespaceVisitor
} from '../src/index';
import {
	getAST,
	verifyASTIsAsExpected
} from './test-utilities';

describe('Global to CJS conversion', () => {
	it('should replace globals with CJS requires.', () => {
		// Given.
		const givenAST = getAST('globaltocjs', 'given');

		rootNamespaceVisitor.initialize(['my', 'other', 'caplin'], givenAST.program.body, 'SimpleClass');

		// When.
		visit(givenAST, rootNamespaceVisitor);

		// Then.
		verifyASTIsAsExpected('globaltocjs', 'expected', givenAST);
	});

	it('should replace globals with CJS requires but not add an export.', () => {
		// Given.
		const givenNoExportAST = getAST('globaltocjs', 'given-no-export');

		rootNamespaceVisitor.initialize(['my', 'other'], givenNoExportAST.program.body, 'SimpleClass', false);

		// When.
		visit(givenNoExportAST, rootNamespaceVisitor);

		// Then.
		verifyASTIsAsExpected('globaltocjs', 'expected-no-export', givenNoExportAST);
	});

	it('should not add an export if one is already present.', () => {
		// Given.
		const givenExportAST = getAST('globaltocjs', 'given-export-present');

		rootNamespaceVisitor.initialize(['my', 'other'], givenExportAST.program.body, 'SimpleClass');

		// When.
		visit(givenExportAST, rootNamespaceVisitor);

		// Then.
		verifyASTIsAsExpected('globaltocjs', 'expected-export-present', givenExportAST);
	});

	it('should replace globals with CJS requires and export class instance.', () => {
		// Given.
		const givenIIFEConstructorAST = getAST('globaltocjs', 'given-iife-constructor');

		rootNamespaceVisitor.initialize(['my', 'other'], givenIIFEConstructorAST.program.body, 'SimpleClass');

		// When.
		visit(givenIIFEConstructorAST, rootNamespaceVisitor);

		// Then.
		verifyASTIsAsExpected('globaltocjs', 'expected-iife-constructor', givenIIFEConstructorAST);
	});
});
