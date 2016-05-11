"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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
 * @return {Object}
 */
exports.compileSourceFiles = compileSourceFiles;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var join = require("path").join;

var writeFile = require("fs").writeFile;

var vinylFs = _interopRequire(require("vinyl-fs"));

var through2 = _interopRequire(require("through2"));

var defaultFormatCode = require("js-formatter").defaultFormatCode;

var _globalCompiler = require("../../global-compiler");

var createRemoveClassNameClassExportVisitor = _globalCompiler.createRemoveClassNameClassExportVisitor;
var iifeClassFlattenerVisitor = _globalCompiler.iifeClassFlattenerVisitor;
var namespacedClassFlattenerVisitor = _globalCompiler.namespacedClassFlattenerVisitor;

var _commonTransforms = require("./common-transforms");

var addAliasRequires = _commonTransforms.addAliasRequires;
var parseJSFile = _commonTransforms.parseJSFile;
var transformSLJSUsage = _commonTransforms.transformSLJSUsage;
var convertASTToBuffer = _commonTransforms.convertASTToBuffer;
var transformI18nUsage = _commonTransforms.transformI18nUsage;
var addRequiresForCaplinBootstrap = _commonTransforms.addRequiresForCaplinBootstrap;
var addRequiresForLibraries = _commonTransforms.addRequiresForLibraries;
var convertGlobalsToRequires = _commonTransforms.convertGlobalsToRequires;
var expandVarNamespaceAliases = _commonTransforms.expandVarNamespaceAliases;
var transformGetServiceToRequire = _commonTransforms.transformGetServiceToRequire;
var transformClassesToUseTopiarist = _commonTransforms.transformClassesToUseTopiarist;
var replaceLibraryIncludesWithRequires = _commonTransforms.replaceLibraryIncludesWithRequires;

var _utilsUtilities = require("./utils/utilities");

var getFileNamespace = _utilsUtilities.getFileNamespace;
var transformASTAndPushToNextStream = _utilsUtilities.transformASTAndPushToNextStream;

function NO_OP() {}
function compileSourceFiles(options) {
	var outputDirectory = options.outputDirectory;

	return vinylFs.src([options.filesToCompile, "!**/bundle.js"]).pipe(parseJSFile()).pipe(expandVarNamespaceAliases(options.namespaces)).pipe(through2.obj(stripFauxCJSExports)).pipe(through2.obj(flattenIIFEClass)).pipe(through2.obj(flattenClass)).pipe(addAliasRequires(options.applicationAliases)).pipe(transformSLJSUsage()).pipe(transformGetServiceToRequire()).pipe(convertGlobalsToRequires(options.namespaces)).pipe(transformClassesToUseTopiarist()).pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire)).pipe(transformI18nUsage()).pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable)).pipe(addRequiresForCaplinBootstrap()).pipe(convertASTToBuffer()).pipe(formatCode(options.formatterOptions)).pipe(vinylFs.dest(options.outputDirectory)).on("end", function () {
		writeFile(join(outputDirectory, ".js-style"), "common-js", NO_OP);
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
function stripFauxCJSExports(fileMetadata, encoding, callback) {
	var classNamespace = getFileNamespace(fileMetadata);
	var removeClassNameClassExportVisitor = createRemoveClassNameClassExportVisitor(classNamespace);

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
function formatCode() {
	return through2.obj(function pushFormattedCode(fileMetadata, encoding, callback) {
		// Format the transformed code, vinyl-fs needs file contents to be a Buffer
		fileMetadata.contents = new Buffer(defaultFormatCode(fileMetadata.contents.toString()));
		this.push(fileMetadata);
		callback();
	});
}

// Ignored callback.