'use strict';

var globalCompiler = require("../");

describe('GlobalCompiler flattening', function() {
	it('should remove the class namespace.', function() {
		var code = globalCompiler.compileFile([
			'--flatten',
			'my.long.name.space.SimpleClass',
			'test/flatten/SimpleClass.js'
		]);
	})
});
