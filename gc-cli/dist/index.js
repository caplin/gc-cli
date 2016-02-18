

/**
 * Options object.
 *
 * @typedef {Object} OptionsObject
 * @property {string} outputDirectory - Directory to output transformed files to.
 * @property {boolean} compileTestFiles - True if files to compile are test files.
 * @property {Set} moduleIDsToRemove - Set of module IDs to remove following transforms.
 * @property {string[]} namespaces - Array of namespace roots to convert to CJS requires.
 * @property {Map<List<string>, string>} libraryIdentifiersToRequire Map of library identifiers to add CJS requires for
 * @property {Set<string>} libraryIncludesToRequire Library includes that should be transformed to requires when found
 * @property {List<string>} libraryIncludeList - The MemberExpression sequence that corresponds to a library include.
 */

/**
 * Converts CLI arguments to an OptionsObject.
 *
 * @param {Object} options CLI arguments to configure transforms
 * @returns {OptionsObject} An OptionsObject based on the provided CLI arguments
 */
"use strict";

exports.createOptionsObject = createOptionsObject;

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
exports.processFile = processFile;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var List = require("immutable").List;

var compileTestFiles = require("./test-files-compiler").compileTestFiles;

var compileSourceFiles = require("./src-files-compiler").compileSourceFiles;

function createOptionsObject(_ref) {
	var namespaces = _ref.namespaces;
	var compileTestFiles = _ref.compileTestFiles;
	var removeRequires = _ref.removeRequires;
	var outputDirectory = _ref.outputDirectory;
	var _ = _ref._;

	var optionsObject = {
		namespaces: namespaces.split(","),
		compileTestFiles: compileTestFiles,
		moduleIDsToRemove: new Set([removeRequires])
	};

	// _ is an array of values that aren't covered by the CLI options this can be used to provide a
	// directory/file or list of files to convert, globs are accepted
	optionsObject.filesToCompile = filesToCompile(_, compileTestFiles);

	if (compileTestFiles) {
		optionsObject.outputDirectory = outputDirectory || "tests";
	} else {
		optionsObject.outputDirectory = outputDirectory || "src";
	}

	optionsObject.libraryIdentifiersToRequire = new Map([[List.of("caplin"), "caplin-bootstrap"], [List.of("emitr"), "emitr"], [List.of("jQuery"), "jquery"], [List.of("sinon"), "sinonjs"], [List.of("queryString"), "query-string"], [List.of("moment", "()", "tz"), "moment-timezone"]]);

	optionsObject.libraryIncludesToRequire = new Set(["chosen"]);
	optionsObject.libraryIncludeIterable = List.of("caplin", "thirdparty");

	return optionsObject;
}

function processFile(optionsObject) {
	if (optionsObject.compileTestFiles) {
		var testConversionStream = compileTestFiles(optionsObject);

		testConversionStream.on("end", function () {
			optionsObject.filesToCompile = "src-test/**/*.js";
			optionsObject.outputDirectory = "src-test";
			compileSourceFiles(optionsObject);
		});
	} else {
		compileSourceFiles(optionsObject);
	}
}

/**
 * Return which files are to be compiled.
 *
 * @param   {Array}                cliProvidedFiles Array of files provided via the CLI
 * @param   {Boolean}              compileTestFiles Are the test files to be compiled
 * @returns {String|Array<String>} The files to compile
 */
function filesToCompile(cliProvidedFiles, compileTestFiles) {
	// If the user provided some files via the CLI compile them
	if (cliProvidedFiles.length > 0) {
		return cliProvidedFiles;
	} else if (compileTestFiles) {
		return "tests/**/*.js";
	}

	return "src/**/*.js";
}