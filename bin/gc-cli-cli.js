#!/usr/bin/env node
"use strict";

var System = require('systemjs');

System.config({
	baseURL: __dirname.replace('bin', ''),

	map: {
		'global-compiler': 'node_modules/global-compiler/index'
	}
});

System.import('src/index')
	.then(function(gcCli) {
		gcCli.processFile(process.argv.slice(2));
	})
	.catch(function(error) {
		console.error(error);
	});
