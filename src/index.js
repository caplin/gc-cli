var Sequence = require('immutable').Sequence;

import {compileTestFiles} from './test-files-compiler';
import {compileSourceFiles} from './src-files-compiler';

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<Sequence<string>, string>} libraryIdentifiersToRequire - Map of library identifiers to add CJS requires for.
 * @property {Set<string>} libraryIncludesToRequire - Library includes that should be transformed to requires when found.
 * @property {Sequence<string>} libraryIncludeSequence - The MemberExpression sequence that corresponds to a library include.
 */

/**
 * Converts CLI arguments to an OptionsObject.
 *
 * @param {Object} args - CLI arguments to configure transforms.
 * @returns {OptionsObject} An OptionsObject based on the provided CLI arguments.
 */
export function createOptionsObject(options) {
	var optionsObject = {
		namespaces: options.namespaces.split(','),
		compileTestFiles: options.compileTestFiles,
		moduleIDsToRemove: new Set([options.removeRequires])
	};

	if (options.compileTestFiles) {
		optionsObject.outputDirectory = (options.outputDirectory || 'tests');
	} else {
		optionsObject.outputDirectory = (options.outputDirectory || 'src');
	}

	optionsObject.libraryIdentifiersToRequire = new Map([
		[Sequence(['emitr']), 'emitr'],
		[Sequence(['moment', '()', 'tz']), 'moment-timezone']
	]);

	optionsObject.libraryIncludesToRequire = new Set(['chosen']);
	optionsObject.libraryIncludeSequence = Sequence.from(['caplin', 'thirdparty']);

	return optionsObject;
}

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
export function processFile(optionsObject) {
	if (optionsObject.compileTestFiles) {
		compileTestFiles(optionsObject);
	} else {
		compileSourceFiles(optionsObject);
	}
}
