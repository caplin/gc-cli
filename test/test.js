'use strict';

var fs = require('fs');
var assert = require('assert');

var globalCompilerCli = require('../');

describe('GlobalCompiler flattening', function() {
	it('should remove the class namespace.', function() {
		var expectedResult = fs.readFileSync('test/src/my/long/name/space/expected.js', {encoding: 'utf-8'});
		var code = globalCompilerCli.processFile([
			'--flatten',
			'src/my/long/name/space/SimpleClass.js'
		]);

		assert.equal(code, expectedResult);
	});
});
