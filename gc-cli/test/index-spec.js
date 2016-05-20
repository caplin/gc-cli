/* eslint-disable id-length */

import {
	equal,
	deepEqual
} from 'assert';

import {describe, it} from 'mocha';

import {createOptionsObject} from '../src/index';

describe('index', () => {
	it('should create a default options object with default arguments options.', () => {
		// Given.
		const stubDefaultArgumentsObject = {
			_: [],
			compileTestFiles: false,
			t: false,
			removeRequires: 'caplin',
			r: 'caplin',
			namespaces: 'caplin,caplinx,caplinps,ct,br',
			n: 'caplin,caplinx,caplinps,ct,br'
		};

		// When.
		const optionsObject = createOptionsObject(stubDefaultArgumentsObject);

		// Then.
		equal(optionsObject.outputDirectory, 'src');
		equal(optionsObject.compileTestFiles, false);
		equal(optionsObject.filesToCompile, 'src/**/*.js');
		deepEqual(optionsObject.namespaces, ['caplin', 'caplinx', 'caplinps', 'ct', 'br']);
	});

	it('should create an options object with test arguments options.', () => {
		// Given.
		const stubDefaultArgumentsObject = {
			_: [],
			compileTestFiles: true,
			t: true,
			removeRequires: 'caplin',
			r: 'caplin',
			namespaces: 'caplin,caplinx,caplinps,ct,br',
			n: 'caplin,caplinx,caplinps,ct,br'
		};

		// When.
		const optionsObject = createOptionsObject(stubDefaultArgumentsObject);

		// Then.
		equal(optionsObject.outputDirectory, 'tests');
		equal(optionsObject.compileTestFiles, true);
		equal(optionsObject.filesToCompile, 'tests/**/*.js');
		deepEqual(optionsObject.namespaces, ['caplin', 'caplinx', 'caplinps', 'ct', 'br']);
	});

	it('should create an options object with provided files to compile.', () => {
		// Given.
		const stubDefaultArgumentsObject = {
			_: ['src/caplin/core/event/PopoutAwareEventHub.js'],
			compileTestFiles: false,
			t: false,
			removeRequires: 'caplin',
			r: 'caplin',
			namespaces: 'caplin,caplinx,caplinps,ct,br',
			n: 'caplin,caplinx,caplinps,ct,br'
		};

		// When.
		const optionsObject = createOptionsObject(stubDefaultArgumentsObject);

		// Then.
		equal(optionsObject.outputDirectory, 'src');
		equal(optionsObject.compileTestFiles, false);
		equal(optionsObject.filesToCompile, 'src/caplin/core/event/PopoutAwareEventHub.js');
		deepEqual(optionsObject.namespaces, ['caplin', 'caplinx', 'caplinps', 'ct', 'br']);
	});
});
