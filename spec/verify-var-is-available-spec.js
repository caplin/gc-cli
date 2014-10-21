const fs = require('fs');
const assert = require('assert');

const {parse, visit} = require('recast');
import {verifyVarIsAvailableVisitor} from '../index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/verify-var-is-available/';
const givenFile = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const givenAST = parse(givenFile);

describe('verify var is available', function() {
	it('should correctly identify a free var name.', function() {
		checkIfVarIsAvailable('FreeName', 'FreeName');
	});

	it('should correctly identify a taken var name.', function() {
		checkIfVarIsAvailable('Factory', 'Factory__2');
	});

	it('should correctly identify a free var name even if used in expression.', function() {
		checkIfVarIsAvailable('callToSuper', 'callToSuper');
	});
});

function checkIfVarIsAvailable(varNameToCheck, freeVariableName) {
	//Given.
	verifyVarIsAvailableVisitor.initialize();

	//When.
	visit(givenAST, verifyVarIsAvailableVisitor);

	//Then.
	assert.equal(verifyVarIsAvailableVisitor.getFreeVariation(varNameToCheck), freeVariableName);
}
