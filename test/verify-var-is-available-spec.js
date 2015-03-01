const fs = require('fs');
const assert = require('assert');

const {parse, visit} = require('recast');
import {verifyVarIsAvailableVisitor} from '../src/index';

const fileOptions = {encoding: 'utf-8'};
const testResourcesLocation = 'test/resources/verify-var-is-available/';
const givenCode = fs.readFileSync(testResourcesLocation + 'given.js', fileOptions);
const givenAST = parse(givenCode);

describe('verify var is available', function() {
	it('should correctly identify a free var name.', function() {
		checkIfVarIsAvailable('FreeName', 'FreeName');
	});

	it('should correctly identify a taken var name.', function() {
		checkIfVarIsAvailable('Factory', 'Factory2');
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
