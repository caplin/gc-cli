'use strict';

var fs = require('fs');
var assert = require('assert');

var globalCompiler = require('../');

describe('Global to CJS conversion', function() {
	it('should replace globals with CJS requires.', function() {
		var expectedResult = fs.readFileSync('test/globaltocjs/expected.js', {encoding: 'utf-8'});
		var code = globalCompiler.compileFile([
			'--rootnstocjs',
			'my',
			'test/globaltocjs/given.js'
		]);

		assert.equal(code, expectedResult);
	})
});
