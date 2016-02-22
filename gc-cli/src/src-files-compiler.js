import {join} from 'path';
import {
	writeFile,
	unlink
} from 'fs';

import vinylFs from 'vinyl-fs';
import through2 from 'through2';
import {defaultFormatCode} from 'js-formatter';
import {
	createRemoveClassNameClassExportVisitor,
	iifeClassFlattenerVisitor,
	namespacedClassFlattenerVisitor
} from '../../global-compiler';

import {
	parseJSFile,
	transformSLJSUsage,
	convertASTToBuffer,
	transformI18nUsage,
	addRequiresForLibraries,
	convertGlobalsToRequires,
	expandVarNamespaceAliases,
	transformGetServiceToRequire,
	transformClassesToUseTopiarist,
	replaceLibraryIncludesWithRequires
} from './common-transforms';

import {
	getFileNamespace,
	transformASTAndPushToNextStream
} from './utils/utilities';

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
	const outputDirectory = options.outputDirectory;

	return vinylFs.src(options.filesToCompile)
		.pipe(parseJSFile())
		.pipe(expandVarNamespaceAliases(options.namespaces))
		.pipe(through2.obj(stripFauxCJSExports))
		.pipe(through2.obj(flattenIIFEClass))
		.pipe(through2.obj(flattenClass))
		.pipe(transformSLJSUsage())
		.pipe(transformGetServiceToRequire())
		.pipe(convertGlobalsToRequires(options.namespaces))
		.pipe(transformClassesToUseTopiarist())
		.pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire))
		.pipe(transformI18nUsage())
		.pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable))
		.pipe(convertASTToBuffer())
		.pipe(formatCode(options.formatterOptions))
		.pipe(vinylFs.dest(options.outputDirectory))
		.on('end', () => {
			unlink(join(outputDirectory, '.js-style'), () => {});
		});
}

/**
 * @param {OptionsObject} options - Options to configure transforms.
 */
export function compileSourceFilesAndCleanUpJSStyleFiles(options) {
	compileSourceFiles(options)
		.on('end', createJSStyleFiles())
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function stripFauxCJSExports(fileMetadata, encoding, callback) {
	var classNamespace = getFileNamespace(fileMetadata);

	const removeClassNameClassExportVisitor = createRemoveClassNameClassExportVisitor(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, removeClassNameClassExportVisitor, this, callback);
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

	iifeClassFlattenerVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, iifeClassFlattenerVisitor, this, callback);
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

	namespacedClassFlattenerVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, namespacedClassFlattenerVisitor, this, callback);
}

/**
 * Formats code.
 *
 * @returns {Function} Stream transform implementation which formats JS files.
 */
function formatCode(formatterOptions) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		// Format the transformed code, vinyl-fs needs file contents to be a Buffer
		fileMetadata.contents = new Buffer(defaultFormatCode(fileMetadata.contents.toString()));
		this.push(fileMetadata);
		callback();
	})
}

/**
 * Creates files required to notify module loader of file type.
 */
function createJSStyleFiles() {
	return function() {
		unlink('.js-style', () => {});
		writeFile(join('test', '.js-style'), 'namespaced-js', () => {});
		writeFile(join('tests', '.js-style'), 'namespaced-js', () => {});
	}
}
