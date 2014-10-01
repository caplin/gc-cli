#!/usr/bin/env node
"use strict";

var System = require('systemjs');
var parseArgs = require('minimist');

var commandParseOptions = {
	alias: {
		n: 'namespaces',
		r: 'removerequires'
	},
	default : {
		removerequires: 'caplin',
		namespaces: 'caplin,caplinx,caplinps,ct'
	}
};

System.config({
	baseURL: __dirname.replace('bin', ''),

	map: {
		'global-compiler': 'node_modules/global-compiler/index'
	}
});

System.import('src/index')
	.then(function(gcCli) {
		var options = parseArgs(process.argv.slice(2), commandParseOptions);

		gcCli.processFile(options);
	})
	.catch(function(error) {
		console.error(error);
	});
