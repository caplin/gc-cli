"use strict";

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
exports.compileSourceFiles = compileSourceFiles;
var fs = require("fs");
var path = require("path");

var _require = require("recast");

var visit = _require.visit;

var vinylFs = require("vinyl-fs");
var through2 = require("through2");

var _require2 = require("immutable");

var Iterable = _require2.Iterable;

var _require3 = require("js-formatter");

var defaultFormatCode = _require3.defaultFormatCode;

var _globalCompiler = require("global-compiler");

var namespacedClassVisitor = _globalCompiler.namespacedClassVisitor;
var flattenMemberExpression = _globalCompiler.flattenMemberExpression;
var namespacedIIFEClassVisitor = _globalCompiler.namespacedIIFEClassVisitor;
var verifyVarIsAvailableVisitor = _globalCompiler.verifyVarIsAvailableVisitor;
var addRequireForGlobalIdentifierVisitor = _globalCompiler.addRequireForGlobalIdentifierVisitor;

var _commonTransforms = require("./common-transforms");

var parseJSFile = _commonTransforms.parseJSFile;
var transformSLJSUsage = _commonTransforms.transformSLJSUsage;
var convertASTToBuffer = _commonTransforms.convertASTToBuffer;
var transformI18nUsage = _commonTransforms.transformI18nUsage;
var addRequiresForLibraries = _commonTransforms.addRequiresForLibraries;
var convertGlobalsToRequires = _commonTransforms.convertGlobalsToRequires;
var expandVarNamespaceAliases = _commonTransforms.expandVarNamespaceAliases;
var transformGetServiceToRequire = _commonTransforms.transformGetServiceToRequire;
var transformClassesToUseTopiarist = _commonTransforms.transformClassesToUseTopiarist;
var replaceLibraryIncludesWithRequires = _commonTransforms.replaceLibraryIncludesWithRequires;

var _utilsUtilities = require("./utils/utilities");

var getFileNamespace = _utilsUtilities.getFileNamespace;
var transformASTAndPushToNextStream = _utilsUtilities.transformASTAndPushToNextStream;

function compileSourceFiles(options) {
	vinylFs.src("src/**/*.js").pipe(parseJSFile()).pipe(expandVarNamespaceAliases(options.namespaces)).pipe(through2.obj(flattenIIFEClass)).pipe(through2.obj(flattenClass)).pipe(transformSLJSUsage()).pipe(transformGetServiceToRequire()).pipe(convertGlobalsToRequires(options.namespaces)).pipe(transformClassesToUseTopiarist()).pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire)).pipe(transformI18nUsage()).pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable)).pipe(convertASTToBuffer()).pipe(formatCode(options.formatterOptions)).pipe(vinylFs.dest(options.outputDirectory)).on("end", createJSStyleFiles());
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
 * Formats code.
 *
 * @returns {Function} Stream transform implementation which formats JS files.
 */
function formatCode(formatterOptions) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		// Format the transformed code, vinyl-fs needs file contents to be a Buffer
		fileMetadata.contents = new Buffer(defaultFormatCode(fileMetadata.contents.toString()));
		this.push(fileMetadata);
		callback();
	});
}

/**
 * Creates files required to notify module loader of file type.
 */
function createJSStyleFiles() {
	var failedWrites = 0;

	function failedToWriteTestJsStyleFile(error) {
		if (error) {
			failedWrites++;
		}

		if (failedWrites === 2) {
			console.warn("\nNo tests/test .js-style file was created, this may be due to the fact there are no tests");
		}
	}

	return function () {
		fs.writeFile(".js-style", "common-js");
		fs.writeFile(path.join("test", ".js-style"), "namespaced-js", failedToWriteTestJsStyleFile);
		fs.writeFile(path.join("tests", ".js-style"), "namespaced-js", failedToWriteTestJsStyleFile);
	};
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
