'use strict';

var path = require('path');

var System = require('systemjs');

/**
 * Function that loads modules needed for Jasmine tests.
 *
 * @param   {string} absoluteFilePath - File path with Unix path separators.
 * @returns {Promise} Resolves when module is loaded.
 */
module.exports = function(absoluteFilePath) {
	var cwd = process.cwd();

	if (path.sep !== '/') {
		cwd = cwd.replace(new RegExp(/\\/g), '/');
	}

	var relativeFilePath = absoluteFilePath
			.replace(/\.js$/, '')
			.replace(cwd, '.');

	return System.import(relativeFilePath);
}
