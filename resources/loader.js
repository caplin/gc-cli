'use strict';

var System = require('systemjs');

module.exports = function(file) {
	return System.import(file.replace(/\.js$/, ''));
}
