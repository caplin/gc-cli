import {unlink} from "fs";
import {join} from "path";

var vinylFs = require('vinyl-fs');
var through2 = require('through2');

import {
	createRemoveGlobalizeSourceModulesCallVisitor,
	wrapModuleInIIFEVisitor,
	flattenProgramIIFEVisitor
} from 'global-compiler';

import {
	parseJSFile,
	transformSLJSUsage,
	convertASTToBuffer,
	transformI18nUsage,
	addRequiresForLibraries,
	removeCJSModuleRequires,
	convertGlobalsToRequires,
	expandVarNamespaceAliases,
	replaceLibraryIncludesWithRequires
} from './common-transforms';
import {compileSourceFiles} from './src-files-compiler';
import {transformASTAndPushToNextStream} from './utils/utilities';

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<Iterable<string>, string>} libraryIdentifiersToRequire - Map of library identifiers to add CJS requires for.
 * @property {Set<string>} libraryIncludesToRequire - Library includes that should be transformed to requires when found.
 * @property {Iterable<string>} libraryIncludeIterable - The MemberExpression sequence that corresponds to a library include.
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
	const outputDirectory = options.outputDirectory;

	return vinylFs.src(options.filesToCompile)
		.pipe(parseJSFile())
		.pipe(through2.obj(removeGlobalizeSourceModulesCall))
		.pipe(through2.obj(flattenProgramIIFE))
		.pipe(expandVarNamespaceAliases(options.namespaces))
		.pipe(transformSLJSUsage())
		.pipe(convertGlobalsToRequires(options.namespaces, false))
		.pipe(removeCJSModuleRequires(options.moduleIDsToRemove))
		.pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire))
		.pipe(transformI18nUsage())
		.pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable))
		.pipe(through2.obj(wrapModuleInIIFE))
		.pipe(convertASTToBuffer())
		.pipe(vinylFs.dest(options.outputDirectory))
		.on('end', () => {
			unlink(join(outputDirectory, '.js-style'), () => {});
		});
}

/**
 * @param {OptionsObject} options - Options to configure transforms.
 */
export function compileTestAndSrcTestFiles(optionsObject) {
	var testConversionStream = compileTestFiles(optionsObject);

	testConversionStream.on('end', () => {
		optionsObject.filesToCompile = 'src-test/**/*.js';
		optionsObject.outputDirectory = 'src-test';
		compileSourceFiles(optionsObject);
	});
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function removeGlobalizeSourceModulesCall(fileMetadata, encoding, callback) {
	const removeGlobalizeSourceModulesCallVisitor = createRemoveGlobalizeSourceModulesCallVisitor();
	transformASTAndPushToNextStream(fileMetadata, removeGlobalizeSourceModulesCallVisitor, this, callback);
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

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function wrapModuleInIIFE(fileMetadata, encoding, callback) {
	transformASTAndPushToNextStream(fileMetadata, wrapModuleInIIFEVisitor, this, callback);
}
