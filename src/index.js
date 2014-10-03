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
