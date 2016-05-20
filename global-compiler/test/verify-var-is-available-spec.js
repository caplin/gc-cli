const fs = require('fs');
const assert = require('assert');

import {describe, it} from 'mocha';
import {parse, visit} from 'recast';
import {verifyVarIsAvailableVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/verify-var-is-available/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const givenAST = parse(givenCode);

describe('verify var is available', () => {
	it('should correctly identify a free var name.', () => {
		checkIfVarIsAvailable('FreeName', 'FreeName');
	});

	it('should correctly identify a taken var name.', () => {
		checkIfVarIsAvailable('Factory', 'Factory2');
	});

	it('should correctly identify a free var name even if used in expression.', () => {
		checkIfVarIsAvailable('callToSuper', 'callToSuper');
	});
});

function checkIfVarIsAvailable(varNameToCheck, freeVariableName) {
	// Given.
	verifyVarIsAvailableVisitor.initialize();

	// When.
	visit(givenAST, verifyVarIsAvailableVisitor);

	// Then.
	assert.equal(verifyVarIsAvailableVisitor.getFreeVariation(varNameToCheck), freeVariableName);
}
