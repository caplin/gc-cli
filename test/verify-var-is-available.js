'use strict';

var fs = require('fs');
var assert = require('assert');

var System = require('systemjs');
var parse = require('recast').parse;
var visit = require('ast-types').visit;

var given = fs.readFileSync('test/verify-var-is-available/given.js', {encoding: 'utf-8'});
var givenAst = parse(given);

describe('Verify var is available', function() {
	it('should correctly identify a free var name.', function(done) {
		System.import('../index')
			.then(checkIfVarIsAvailable('FreeName', 'FreeName').bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should correctly identify a taken var name.', function(done) {
		System.import('../index')
			.then(checkIfVarIsAvailable('Factory', 'Factory__2').bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should correctly identify a free var name even if used in expression.', function(done) {
		System.import('../index')
			.then(checkIfVarIsAvailable('callToSuper', 'callToSuper').bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function checkIfVarIsAvailable(varNameToCheck, freeVariableName) {
	return function(done, transforms) {
		//Given.
		var verifyVarIsAvailableVisitor = transforms.verifyVarIsAvailableVisitor;
		verifyVarIsAvailableVisitor.initialize(varNameToCheck);

		//When.
		visit(givenAst.program, verifyVarIsAvailableVisitor);

		//Then.
		assert.equal(verifyVarIsAvailableVisitor.getFreeVariation(varNameToCheck), freeVariableName);

		done();
	}
}
