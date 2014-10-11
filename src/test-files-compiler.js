var vinylFs = require('vinyl-fs');
var through2 = require('through2');

import {flattenProgramIIFEVisitor} from 'global-compiler';

import {
	parseJSFile,
	convertASTToBuffer,
	transformI18nUsage,
	expandNamespaceAliases,
	removeCJSModuleRequires,
	convertGlobalsToRequires
} from './common-transforms';

import {transformASTAndPushToNextStream} from './utils/utilities';

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<Sequence<string>, string>} libraryIdentifiersToRequire - Map of library identifiers to add CJS requires for.
 */

/**
 * File metadata consists of a Vinyl file and an AST property.
 *
 * @typedef {Object} FileMetadata
 * @property {Object} ast - Code AST.
 * @property {String} path - File path.
 * @property {String} base - File base, path without file name.
 */

/**
 * @param {OptionsObject} options - Options to configure transforms.
 */
export function compileTestFiles(options) {
	vinylFs.src('tests/**/*.js')
		.pipe(parseJSFile())
		.pipe(through2.obj(flattenProgramIIFE))
		.pipe(expandNamespaceAliases(options.namespaces))
		.pipe(convertGlobalsToRequires(options.namespaces))
		.pipe(removeCJSModuleRequires(options.moduleIDsToRemove))
		.pipe(transformI18nUsage())
		.pipe(convertASTToBuffer())
		.pipe(vinylFs.dest(options.outputDirectory));
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenProgramIIFE(fileMetadata, encoding, callback) {
	transformASTAndPushToNextStream(fileMetadata, flattenProgramIIFEVisitor, this, callback);
}
