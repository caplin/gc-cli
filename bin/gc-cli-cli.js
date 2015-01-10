#!/usr/bin/env node
"use strict";

var System = require('systemjs');
var parseArgs = require('minimist');

var commandParseOptions = {
	alias: {
		n: 'namespaces',
		r: 'removeRequires',
		o: 'outputDirectory',
		t: 'compileTestFiles'
	},
	default : {
		compileTestFiles: false,
		removeRequires: 'caplin',
		namespaces: 'caplin,caplinx,caplinps,ct'
	}
};

System.config({
	baseURL: 'file:' + __dirname.replace('bin', ''),

	map: {
		'global-compiler': 'node_modules/global-compiler/src'
	}
});

System.import('src/index')
	.then(function(gcCli) {
		var options = parseArgs(process.argv.slice(2), commandParseOptions);
		var optionsObject = gcCli.createOptionsObject(options);

		gcCli.processFile(optionsObject);
	})
	.catch(function(error) {
		console.error(error);
	});
