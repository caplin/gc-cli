const fs = require('fs');
const assert = require('assert');

import {describe, it} from 'mocha';
const {parse, print, visit} = require('recast');
import {rootNamespaceVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/globaltocjs/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const expectedCode = fs.readFileSync(testResourcesLocation + 'expected.js', fileOptions);
const givenAST = parse(givenCode);

const givenNoExportCode = fs.readFileSync(testResourcesLocation + 'given-no-export.js', fileOptions);
const expectedNoExportCode = fs.readFileSync(testResourcesLocation + 'expected-no-export.js', fileOptions);
const givenNoExportAST = parse(givenNoExportCode);

const givenExportCode = fs.readFileSync(testResourcesLocation + 'given-export-present.js', fileOptions);
const expectedExportCode = fs.readFileSync(testResourcesLocation + 'expected-export-present.js', fileOptions);
const givenExportAST = parse(givenExportCode);

const givenIIFEConstructorCode = fs.readFileSync(testResourcesLocation + 'given-iife-constructor.js', fileOptions);
const expectedIIFEConstructorCode = fs.readFileSync(testResourcesLocation + 'expected-iife-constructor.js', fileOptions);
const givenIIFEConstructorAST = parse(givenIIFEConstructorCode);

describe('Global to CJS conversion', function() {
	it('should replace globals with CJS requires.', function() {
		// Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenAST.program.body, 'SimpleClass');

		// When.
		visit(givenAST, rootNamespaceVisitor);

		// Then.
		assert.equal(print(givenAST).code, expectedCode);
	});

	it('should replace globals with CJS requires but not add an export.', function() {
		// Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenNoExportAST.program.body, 'SimpleClass', false);

		// When.
		visit(givenNoExportAST, rootNamespaceVisitor);

		// Then.
		assert.equal(print(givenNoExportAST).code, expectedNoExportCode);
	});

	it('should not add an export if one is already present.', function() {
		// Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenExportAST.program.body, 'SimpleClass');

		// When.
		visit(givenExportAST, rootNamespaceVisitor);

		// Then.
		assert.equal(print(givenExportAST).code, expectedExportCode);
	});

	it('should replace globals with CJS requires and export class instance.', function() {
		// Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenIIFEConstructorAST.program.body, 'SimpleClass');

		// When.
		visit(givenIIFEConstructorAST, rootNamespaceVisitor);

		// Then.
		assert.equal(print(givenIIFEConstructorAST).code, expectedIIFEConstructorCode);
	});
});
