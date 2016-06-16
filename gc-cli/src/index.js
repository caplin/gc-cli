import {
	List
} from 'immutable';

import {
	compileTestAndSrcTestFiles
} from './test-files-compiler';
import {
	compileSourceFiles
} from './src-files-compiler';
import {
	findApplicationAliases
} from './utils/utilities';

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<List<string>, string>} libraryIdentifiersToRequire Map of library identifiers to add CJS requires for
 * @property {Set<string>} libraryIncludesToRequire Library includes that should be transformed to requires when found
 * @property {List<string>} libraryIncludeList - The MemberExpression sequence that corresponds to a library include.
 */

/**
 * Converts CLI arguments to an OptionsObject.
 *
 * @param {Object} options CLI arguments to configure transforms
 * @returns {OptionsObject} An OptionsObject based on the provided CLI arguments
 */
// eslint-disable-next-line
export function createOptionsObject({namespaces, compileTestFiles, removeRequires, outputDirectory, _}) {
	const optionsObject = {
		namespaces: namespaces.split(','),
		compileTestFiles,
		moduleIDsToRemove: new Set([removeRequires])
	};

	// _ is an array of values that aren't covered by the CLI options this can be used to provide a
	// directory/file or list of files to convert, globs are accepted
	optionsObject.filesToCompile = filesToCompile(_, compileTestFiles);

	if (compileTestFiles) {
		optionsObject.outputDirectory = (outputDirectory || 'tests');
	} else {
		optionsObject.outputDirectory = (outputDirectory || 'src');
	}

	optionsObject.libraryIdentifiersToRequire = new Map([
		[List.of('emitr'), 'emitr'],
		[List.of('jQuery'), 'jquery'],
		[List.of('sinon'), 'sinonjs'],
		[List.of('queryString'), 'query-string'],
		[List.of('JsMockito'), 'jsmockito'],
		[List.of('JsHamcrest'), 'jshamcrest'],
		[List.of('Mock4JS'), 'mock4js'],
		[List.of('moment', '()', 'tz'), 'moment-timezone'],
		[List.of('moment'), 'momentjs'],
		[List.of('interact'), 'interact'],
		[List.of('openajax'), 'openajax'],
		[List.of('topiarist'), 'topiarist']
	]);

	optionsObject.libraryIncludesToRequire = new Set([
		'chosen', 'es6-shim', 'jqueryplugins', 'explorercanvas'
	]);
	optionsObject.libraryIncludeIterable = List.of('caplin', 'thirdparty');
	optionsObject.applicationAliases = findApplicationAliases();

	return optionsObject;
}

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
export function processFile(optionsObject) {
	if (optionsObject.compileTestFiles) {
		compileTestAndSrcTestFiles(optionsObject);
	} else {
		compileSourceFiles(optionsObject);
	}
}

/**
 * Return which files are to be compiled.
 *
 * @param   {Array}                cliProvidedFiles Array of files provided via the CLI
 * @param   {Boolean}              compileTestFiles Are the test files to be compiled
 * @returns {String} The files to compile
 */
function filesToCompile(cliProvidedFiles, compileTestFiles) {
	// If the user provided some files via the CLI compile them
	if (cliProvidedFiles.length > 0) {
		// We only compile the first file glob the user provides and if we want to allow the user
		// to compile multiple globs the return type of this function should be changed.
		return cliProvidedFiles[0];
	} else if (compileTestFiles) {
		return 'tests/**/*.js';
	}

	return 'src/**/*.js';
}
