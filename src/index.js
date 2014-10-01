var path = require('path');

var chalk = require('chalk');
var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
import {
	moduleIdVisitor,
	rootNamespaceVisitor,
	namespacedClassVisitor,
	flattenMemberExpression,
	cjsRequireRemoverVisitor,
	namespacedIIFEClassVisitor,
	verifyVarIsAvailableVisitor
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
	var outputDir = options.output || './src';
	var moduleIdsToRemove = new Set((options.removerequires || '').split(','));

	vinylFs.src('src/**/*.js')
		.pipe(through2.obj(parseJsFile))
		.pipe(through2.obj(flattenIIFEClass))
		.pipe(through2.obj(flattenClass))
		.pipe(convertGlobalsToRequires(options.namespaces))
		.pipe(removeCjsModuleRequires(moduleIdsToRemove))
		.pipe(transformI18NUsage())
		.pipe(through2.obj(convertAstToBuffer))
		.pipe(vinylFs.dest(outputDir));
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
		cjsRequireRemoverVisitor.initialize(moduleIdsToRemove);
		transformASTAndPushToNextStream(fileMetadata, cjsRequireRemoverVisitor, this, callback);
	});
}

/**
 * This transform is use case specific in that it replaces use of one i18n library with another.
 * The transform is multi-stage as it uses more generic transforms.
 *
 * @returns {Function} Stream transform implementation which replaces i18n usage with another library.
 */
function transformI18NUsage() {
	return through2.obj(function(fileMetadata, encoding, callback) {

		verifyVarIsAvailableVisitor.initialize();
		visit(fileMetadata.ast, verifyVarIsAvailableVisitor);
		var freeI18NVariation = verifyVarIsAvailableVisitor.getFreeVariation('i18n');


		var moduleIdsToConvert = new Map([['ct', ['br/I18n', freeI18NVariation]]]);
		moduleIdVisitor.initialize(moduleIdsToConvert);
		visit(fileMetadata.ast, moduleIdVisitor);


		flattenMemberExpression.initialize(['ct', 'i18n'], freeI18NVariation);
		visit(fileMetadata.ast, flattenMemberExpression);

		this.push(fileMetadata);
		callback();
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
