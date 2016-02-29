#!/usr/bin/env babel-node
"use strict";

var parseArgs = require('minimist');

var gcCli = require('../src/index');

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
		namespaces: 'caplin,caplinx,caplinps,ct,br'
	}
};

var options = parseArgs(process.argv.slice(2), commandParseOptions);
var optionsObject = gcCli.createOptionsObject(options);

gcCli.processFile(optionsObject);
