#!/usr/bin/env node

/* eslint-disable id-length, no-var */
'use strict'; // eslint-disable-line

var path = require('path');

var check = require('check-node-version');
var parseArgs = require('minimist');
var error = require('winston').error;

var packageJson = require(path.join(__dirname, '..', '..', 'package.json'));

function versionCheckCallback(versionError, result) {
	var errorMessage = 'Not compatible with current node version, please update!';

	if (result.nodeSatisfied) {
		compileFiles();
	} else {
		if (versionError) {
			errorMessage = versionError.message;
		}

		error(errorMessage);
		process.exit(1); // eslint-disable-line
	}
}

var versionCheckOptions = {
	node: packageJson.engines.node
};

check(versionCheckOptions, versionCheckCallback);

require('babel-register')({
	ignore: false
});

function compileFiles() {
	var commandParseOptions = {
		alias: {
			n: 'namespaces',
			r: 'removeRequires',
			o: 'outputDirectory',
			t: 'compileTestFiles'
		},
		default: {
			compileTestFiles: false,
			removeRequires: 'caplin',
			namespaces: 'caplin,caplinx,caplinps,ct,br'
		}
	};
	var gcCli = require('../src/index'); // eslint-disable-line
	var options = parseArgs(process.argv.slice(2), commandParseOptions);
	var optionsObject = gcCli.createOptionsObject(options);

	gcCli.processFile(optionsObject);
}
