"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * @param {OptionsObject} options - Options to configure transforms.
 * @returns {Stream}
 */
exports.compileTestFiles = compileTestFiles;

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
exports.compileTestAndSrcTestFiles = compileTestAndSrcTestFiles;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var unlink = require("fs").unlink;

var join = require("path").join;

var List = require("immutable").List;

var vinylFs = _interopRequire(require("vinyl-fs"));

var through2 = _interopRequire(require("through2"));

var _globalCompiler = require("../../global-compiler");

var createRemoveGlobalizeSourceModulesCallVisitor = _globalCompiler.createRemoveGlobalizeSourceModulesCallVisitor;
var requireFixturesVisitor = _globalCompiler.requireFixturesVisitor;
var wrapModuleInIIFEVisitor = _globalCompiler.wrapModuleInIIFEVisitor;
var flattenProgramIIFEVisitor = _globalCompiler.flattenProgramIIFEVisitor;

var _commonTransforms = require("./common-transforms");

var parseJSFile = _commonTransforms.parseJSFile;
var transformSLJSUsage = _commonTransforms.transformSLJSUsage;
var convertASTToBuffer = _commonTransforms.convertASTToBuffer;
var transformI18nUsage = _commonTransforms.transformI18nUsage;
var addRequiresForCaplinBootstrap = _commonTransforms.addRequiresForCaplinBootstrap;
var addRequiresForLibraries = _commonTransforms.addRequiresForLibraries;
var removeCJSModuleRequires = _commonTransforms.removeCJSModuleRequires;
var convertGlobalsToRequires = _commonTransforms.convertGlobalsToRequires;
var expandVarNamespaceAliases = _commonTransforms.expandVarNamespaceAliases;
var pruneRedundantRequires = _commonTransforms.pruneRedundantRequires;
var replaceLibraryIncludesWithRequires = _commonTransforms.replaceLibraryIncludesWithRequires;

var compileSourceFiles = require("./src-files-compiler").compileSourceFiles;

var transformASTAndPushToNextStream = require("./utils/utilities").transformASTAndPushToNextStream;

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<Iterable<string>, string>} libraryIdentifiersToRequire - Map of library identifiers to add
 *                                           CJS requires for.
 * @property {Set<string>} libraryIncludesToRequire - Library includes that should be transformed to requires
 *                                                  when found.
 * @property {Iterable<string>} libraryIncludeIterable - The MemberExpression sequence that corresponds to a
 *                                                     library include.
 */

/**
 * File metadata consists of a Vinyl file and an AST property.
 *
 * @typedef {Object} FileMetadata
 * @property {Object} ast - Code AST.
 * @property {String} path - File path.
 * @property {String} base - File base, path without file name.
 */

function registerCaplinTestGlobals(options) {
	// All the Caplin test globals and where they should be required from.
	options.libraryIdentifiersToRequire.set(List.of("SL4B_Accessor"), "sl4bdummy->SL4B_Accessor");
	options.libraryIdentifiersToRequire.set(List.of("assertFails"), "jsunitextensions->assertFails");
	options.libraryIdentifiersToRequire.set(List.of("assertAssertError"), "jsunitextensions->assertAssertError");
	options.libraryIdentifiersToRequire.set(List.of("assertNoException"), "jsunitextensions->assertNoException");
	options.libraryIdentifiersToRequire.set(List.of("assertArrayEquals"), "jsunitextensions->assertArrayEquals");
	options.libraryIdentifiersToRequire.set(List.of("assertVariantEquals"), "jsunitextensions->assertVariantEquals");
	options.libraryIdentifiersToRequire.set(List.of("assertMapEquals"), "jsunitextensions->assertMapEquals");
	options.libraryIdentifiersToRequire.set(List.of("triggerKeyEvent"), "jsunitextensions->triggerKeyEvent");
	options.libraryIdentifiersToRequire.set(List.of("triggerMouseEvent"), "jsunitextensions->triggerMouseEvent");
	options.libraryIdentifiersToRequire.set(List.of("Clock"), "jsunitextensions->Clock");
	options.libraryIdentifiersToRequire.set(List.of("ApiProtector"), "jstestdriverextensions->ApiProtector");
	options.libraryIdentifiersToRequire.set(List.of("CaplinTestCase"), "jstestdriverextensions->CaplinTestCase");
	options.libraryIdentifiersToRequire.set(List.of("defineTestCase"), "jstestdriverextensions->defineTestCase");
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {FileMetadata} fileMetadata - File meta data for file being transformed.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function requireFixtures(fileMetadata, encoding, callback) {
	transformASTAndPushToNextStream(fileMetadata, requireFixturesVisitor, this, callback);
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
	var removeGlobalizeSourceModulesCallVisitor = createRemoveGlobalizeSourceModulesCallVisitor();

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
function compileTestFiles(options) {
	registerCaplinTestGlobals(options);

	var outputDirectory = options.outputDirectory;

	return vinylFs.src([options.filesToCompile, "!**/bundle.js"]).pipe(parseJSFile()).pipe(through2.obj(removeGlobalizeSourceModulesCall)).pipe(through2.obj(flattenProgramIIFE)).pipe(expandVarNamespaceAliases(options.namespaces)).pipe(transformSLJSUsage()).pipe(convertGlobalsToRequires(options.namespaces, false)).pipe(removeCJSModuleRequires(options.moduleIDsToRemove)).pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire)).pipe(transformI18nUsage()).pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable)).pipe(addRequiresForCaplinBootstrap()).pipe(pruneRedundantRequires()).pipe(through2.obj(requireFixtures)).pipe(through2.obj(wrapModuleInIIFE)).pipe(convertASTToBuffer()).pipe(vinylFs.dest(options.outputDirectory)).on("end", function () {
		unlink(join(outputDirectory, ".js-style"), function () {});
	});
}

function compileTestAndSrcTestFiles(optionsObject) {
	var testConversionStream = compileTestFiles(optionsObject);

	testConversionStream.on("end", function () {
		optionsObject.filesToCompile = "src-test/**/*.js";
		optionsObject.outputDirectory = "src-test";
		compileSourceFiles(optionsObject);
	});
}