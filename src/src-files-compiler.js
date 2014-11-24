var fs = require('fs');
var path = require('path');

var {visit} = require('recast');
var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var {Iterable} = require('immutable');
const esformatter = require('esformatter');

import {
	namespacedClassVisitor,
	flattenMemberExpression,
	namespacedIIFEClassVisitor,
	verifyVarIsAvailableVisitor,
	addRequireForGlobalIdentifierVisitor
} from 'global-compiler';

import {
	parseJSFile,
	transformSLJSUsage,
	convertASTToBuffer,
	transformI18nUsage,
	addModuleUseStrict,
	removeCJSModuleRequires,
	addRequiresForLibraries,
	convertGlobalsToRequires,
	expandVarNamespaceAliases,
	replaceLibraryIncludesWithRequires
} from './common-transforms';

import {
	getFileNamespace,
	transformASTAndPushToNextStream
} from './utils/utilities';

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
export function compileSourceFiles(options) {
	vinylFs.src('src/**/*.js')
		.pipe(parseJSFile())
		.pipe(expandVarNamespaceAliases(options.namespaces))
		.pipe(through2.obj(flattenIIFEClass))
		.pipe(through2.obj(flattenClass))
		.pipe(transformSLJSUsage())
		.pipe(convertGlobalsToRequires(options.namespaces))
		.pipe(removeCJSModuleRequires(options.moduleIDsToRemove))
		.pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire))
		.pipe(transformI18nUsage())
		.pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable))
		.pipe(addModuleUseStrict())
		.pipe(convertASTToBuffer())
		.pipe(formatCode(options.formatterOptions))
		.pipe(vinylFs.dest(options.outputDirectory))
		.on('end', createJSStyleFiles());
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenIIFEClass(fileMetadata, encoding, callback) {
	var classNamespace = getFileNamespace(fileMetadata);

	namespacedIIFEClassVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, namespacedIIFEClassVisitor, this, callback);
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenClass(fileMetadata, encoding, callback) {
	var classNamespace = getFileNamespace(fileMetadata);

	namespacedClassVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, namespacedClassVisitor, this, callback);
}

/**
 * Formats code based on provided formatter options.
 *
 * @param   {Object} formatterOptions - Options to configure formatting.
 * @returns {Function} Stream transform implementation which formats JS files.
 */
function formatCode(formatterOptions) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		const codeToFormat = fileMetadata.contents.toString();
		const formattedCode = esformatter.format(codeToFormat, formatterOptions);
		const convertedCodeBuffer = new Buffer(formattedCode);

		fileMetadata.contents = convertedCodeBuffer;
		this.push(fileMetadata);
		callback();
	})
}

/**
 * Creates files required to notify module loader of file type.
 */
function createJSStyleFiles() {
	let failedWrites = 0;

	function failedToWriteTestJsStyleFile (error) {
		if (error) {
			failedWrites++;
		}

		if (failedWrites === 2) {
			console.warn('\nNo tests/test .js-style file was created, this may be due to the fact there are no tests');
		}
	}

	return function() {
		fs.writeFile('.js-style', 'common-js');
		fs.writeFile(path.join('test', '.js-style'), 'namespaced-js', failedToWriteTestJsStyleFile);
		fs.writeFile(path.join('tests', '.js-style'), 'namespaced-js', failedToWriteTestJsStyleFile);
	}
}
