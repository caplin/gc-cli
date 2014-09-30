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
			.then(checkIfVarIsAvailable('FreeName', true).bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should correctly identify a taken var name.', function(done) {
		System.import('../index')
			.then(checkIfVarIsAvailable('Factory__1', false).bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});

	it('should correctly identify a free var name even if used in expression.', function(done) {
		System.import('../index')
			.then(checkIfVarIsAvailable('callToSuper', true).bind(null, done))
			.catch(function(error) {
				done(error);
			});
	});
});

function checkIfVarIsAvailable(varNameToCheck, isFree) {
	return function(done, transforms) {
		//Given.
		var verifyVarIsAvailableVisitor = transforms.verifyVarIsAvailableVisitor;
		verifyVarIsAvailableVisitor.initialize(varNameToCheck);

		//When.
		visit(givenAst, verifyVarIsAvailableVisitor);

		//Then.
		assert.equal(verifyVarIsAvailableVisitor.varIsAvailable, isFree);

		done();
	}
}
