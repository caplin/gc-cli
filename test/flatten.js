'use strict';

var fs = require('fs');
var assert = require('assert');

var globalCompiler = require('../');

describe('GlobalCompiler flattening', function() {
	it('should remove the class namespace.', function() {
		var expectedResult = fs.readFileSync('test/flatten/expected.js', {encoding: 'utf-8'});
		var code = globalCompiler.compileFile([
			'--flatten',
			'my.long.name.space.SimpleClass',
			'test/flatten/given.js'
		]);

		assert.equal(code, expectedResult);
	})
});
