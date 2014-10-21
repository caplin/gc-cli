'use strict';

var path = require('path');

var System = require('systemjs');

module.exports = function(absoluteFilePath) {
	var relativeFilePath = absoluteFilePath.replace(/\.js$/, '').replace(process.cwd(), '.');

	return System.import(relativeFilePath);
}
