'use strict';

var fs = require('fs');
var assert = require('assert');

var globalCompiler = require('../');

describe('GlobalCompiler flattening', function() {
	it('should remove the class namespace.', function() {
		var expectedResult = fs.readFileSync('test/flatten/SimpleClassFlattened.js', {encoding: 'utf-8'});
		var code = globalCompiler.compileFile([
			'--flatten',
			'my.long.name.space.SimpleClass',
			'test/flatten/SimpleClass.js'
		]);

		assert.equal(code, expectedResult);
	})
});
