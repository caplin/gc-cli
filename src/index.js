var path = require('path');

var chalk = require('chalk');
var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
import {
	rootNamespaceVisitor,
	namespacedClassVisitor,
	cjsRequireRemoverVisitor,
	namespacedIIFEClassVisitor
} from 'global-compiler';

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {String} ns - Alias for namespace.
 * @property {String} namespace - Comma separated list of root namespaces to convert to CJS.
 */

/**
 * Vinyl file.
 *
 * @typedef {Object} VinylFile
 * @property {String} path - File path.
 * @property {String} base - File base, path without file name.
 */

/**
 * @param {OptionsObject} options - Options to configure transforms.
 */
export function processFile(options) {
	var moduleIdsToRemove = new Set([(options.removerequires || '').split(',')]);
	vinylFs.src('src/**/*.js')
		.pipe(through2.obj(parseJsFile))
		.pipe(through2.obj(flattenIIFEClass))
		.pipe(through2.obj(flattenClass))
		.pipe(convertGlobalsToRequires(options.namespaces))
		.pipe(removeCjsModuleRequires(moduleIdsToRemove))
		.pipe(through2.obj(convertAstToBuffer))
		.pipe(vinylFs.dest('./src'));
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {VinylFile} vinylFile - Virtual file object.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function parseJsFile(vinylFile, encoding, callback) {
	console.log(chalk.green('Parsing'), chalk.bold(vinylFile.relative));

	var fileAst = parse(vinylFile.contents.toString());

	vinylFile.ast = fileAst;
	this.push(vinylFile);
	callback();
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenIIFEClass(fileMetadata, encoding, callback) {
	console.log(chalk.green('Flatten IIFE if required'), chalk.bold(fileMetadata.relative));

	var classNamespace = getFileNamespace(fileMetadata);

	namespacedIIFEClassVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, namespacedIIFEClassVisitor, this, callback);
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenClass(fileMetadata, encoding, callback) {
	console.log(chalk.green('Flatten class if required'), chalk.bold(fileMetadata.relative));

	var classNamespace = getFileNamespace(fileMetadata);

	namespacedClassVisitor.initialize(classNamespace);
	transformASTAndPushToNextStream(fileMetadata, namespacedClassVisitor, this, callback);
}

/**
 * @param {String} namespaces - Comma separated list of root namespaces to convert to CJS.
 * @returns {Function} Stream transform implementation which replaces all global namespaced code with module references.
 */
function convertGlobalsToRequires(namespaces) {
	var rootNamespaces = namespaces.split(',');

	return through2.obj(function(fileMetadata, encoding, callback) {
		console.log(chalk.green('Convert class to module'), chalk.bold(fileMetadata.relative));

		var className = getFileNamespaceParts(fileMetadata).pop();

		rootNamespaceVisitor.initialize(rootNamespaces, fileMetadata.ast.program.body, className);
		transformASTAndPushToNextStream(fileMetadata, rootNamespaceVisitor, this, callback);
	});
}

/**
 * @param {Set<string>} moduleIdsToRemove - The module Ids to remove.
 * @returns {Function} Stream transform implementation which removes specified cjs requires.
 */
function removeCjsModuleRequires(moduleIdsToRemove) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		console.log(chalk.green('Remove required modules'), chalk.bold(fileMetadata.relative));

		cjsRequireRemoverVisitor.initialize(moduleIdsToRemove);
		transformASTAndPushToNextStream(fileMetadata, cjsRequireRemoverVisitor, this, callback);
	});
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function convertAstToBuffer(fileMetadata, encoding, callback) {
	console.log(chalk.green('Convert AST to Buffer'), chalk.bold(fileMetadata.relative));

	var convertedCode = print(fileMetadata.ast, {wrapColumn: 200}).code;
	var convertedCodeBuffer = new Buffer(convertedCode);

	fileMetadata.contents = convertedCodeBuffer;
	this.push(fileMetadata);
	callback();
}

function transformASTAndPushToNextStream(fileMetadata, visitor, streamTransform, callback) {
	try {
		visit(fileMetadata.ast, visitor);
	} catch (error) {
		console.error(chalk.red(error));
		callback(error);
	}

	streamTransform.push(fileMetadata);
	callback();
}

function getFileNamespace(fileMetadata) {
	return getFileNamespaceParts(fileMetadata).join('.');
}

function getFileNamespaceParts(fileMetadata) {
	return fileMetadata.relative.replace(/\.js$/, '').split(path.sep);
}
