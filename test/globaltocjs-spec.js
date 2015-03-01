const fs = require('fs');
const assert = require('assert');

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

const givenIIFEConstructorCode = fs.readFileSync(testResourcesLocation + 'given-iife-constructor.js', fileOptions);
const expectedIIFEConstructorCode = fs.readFileSync(testResourcesLocation + 'expected-iife-constructor.js', fileOptions);
const givenIIFEConstructorAST = parse(givenIIFEConstructorCode);

describe('Global to CJS conversion', function() {
	it('should replace globals with CJS requires.', function() {
		//Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenAST.program.body, 'SimpleClass');

		//When.
		visit(givenAST, rootNamespaceVisitor);

		//Then.
		assert.equal(print(givenAST).code, expectedCode);
	});

	it('should replace globals with CJS requires but not add an export.', function() {
		//Given.
		rootNamespaceVisitor.initialize(['my', 'other'], givenNoExportAST.program.body, 'SimpleClass', false);

		//When.
		visit(givenNoExportAST, rootNamespaceVisitor);

		//Then.
		assert.equal(print(givenNoExportAST).code, expectedNoExportCode);
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
