"use strict";

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
 * Converts CLI arguments to an OptionsObject.
 *
 * @param {Object} args - CLI arguments to configure transforms.
 * @returns {OptionsObject} An OptionsObject based on the provided CLI arguments.
 */
exports.createOptionsObject = createOptionsObject;

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
exports.processFile = processFile;

var _require = require("immutable");

var Iterable = _require.Iterable;

var compileTestFiles = require("./test-files-compiler").compileTestFiles;

var compileSourceFiles = require("./src-files-compiler").compileSourceFiles;

function createOptionsObject(options) {
	var optionsObject = {
		namespaces: options.namespaces.split(","),
		compileTestFiles: options.compileTestFiles,
		moduleIDsToRemove: new Set([options.removeRequires])
	};

	if (options.compileTestFiles) {
		optionsObject.outputDirectory = options.outputDirectory || "tests";
	} else {
		optionsObject.outputDirectory = options.outputDirectory || "src";
	}

	optionsObject.libraryIdentifiersToRequire = new Map([[Iterable(["emitr"]), "emitr"], [Iterable(["jQuery"]), "jquery"], [Iterable(["sinon"]), "sinonjs"], [Iterable(["queryString"]), "query-string"], [Iterable(["moment", "()", "tz"]), "moment-timezone"]]);

	optionsObject.libraryIncludesToRequire = new Set(["chosen"]);
	optionsObject.libraryIncludeIterable = Iterable(["caplin", "thirdparty"]);

	return optionsObject;
}

function processFile(optionsObject) {
	if (optionsObject.compileTestFiles) {
		compileTestFiles(optionsObject);
	} else {
		compileSourceFiles(optionsObject);
	}
}

Object.defineProperty(exports, "__esModule", {
	value: true
});