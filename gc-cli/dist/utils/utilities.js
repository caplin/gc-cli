

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @param {Object} visitor - AST visitor.
 * @param {Object} streamTransform - Stream transform instance.
 * @param {Function} callback - Used to flush data down the stream.
 * @return {undefined}
 */
"use strict";

exports.transformASTAndPushToNextStream = transformASTAndPushToNextStream;

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @returns {string} File namespace, namespace parts separated by '.'.
 */
exports.getFileNamespace = getFileNamespace;

/**
 * @param {FileMetadata} fileMetadata File metadata for file being visited, a Vinyl File object
 * @returns {Array} File namespace parts.
 */
exports.getFileNamespaceParts = getFileNamespaceParts;

/**
 * Finds all the aliases defined/available in an application.
 *
 * @return {Set<string>}
 */
exports.findApplicationAliases = findApplicationAliases;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var _fs = require("fs");

var readdirSync = _fs.readdirSync;
var readFileSync = _fs.readFileSync;

var _path = require("path");

var dirname = _path.dirname;
var join = _path.join;
var sep = _path.sep;

var parse = require("elementtree").parse;

var sync = require("glob").sync;

var visit = require("recast").visit;

function transformASTAndPushToNextStream(fileMetadata, visitor, streamTransform, callback) {
	try {
		visit(fileMetadata.ast, visitor);
	} catch (error) {
		console.error(visitor); // eslint-disable-line
		console.error(fileMetadata); // eslint-disable-line
		console.error(error); // eslint-disable-line

		return callback(error);
	}

	streamTransform.push(fileMetadata);

	return callback();
}

function getFileNamespace(fileMetadata) {
	return getFileNamespaceParts(fileMetadata).join(".");
}

function getFileNamespaceParts(fileMetadata) {
	// The cwd is the blade/libs directory (where the user should be invoking the CLI) and the path
	// is the absolute path to the JS file. Stripping away one from the other returns the relative
	// path to the JS file.
	var filePathRelativeToCWD = fileMetadata.path.replace(fileMetadata.cwd, "");
	// Namespaced files are only present in src files so we need to remove the src prefix from the
	// file path. Test files aren't namespaced so this function isn't called by the test transform
	var filePathWithoutSrc = filePathRelativeToCWD.replace("" + sep + "src" + sep, "").replace("" + sep + "src-test" + sep, "");

	// Remove the JS file suffix and break up the path string by directory separator
	return filePathWithoutSrc.replace(/\.js$/, "").split(sep);
}

function findApplicationAliases() {
	var brjsProjectRoot = findBRJSProjectRoot();

	return gatherApplicationAliases(brjsProjectRoot);
}

function findBRJSProjectRoot() {
	var current = process.cwd();
	var currentDirectoryContents = readdirSync(current);

	while (currentDirectoryContents.includes("apps") === false && currentDirectoryContents.includes("sdk") === false && current !== dirname(current)) {
		current = dirname(current);
		currentDirectoryContents = readdirSync(current);
	}

	return current;
}

function gatherApplicationAliases(brjsProjectRoot) {
	var aliasDefinitionsFileNames = sync("**/aliasDefinitions.xml", { cwd: brjsProjectRoot });
	var applicationAliases = new Set();

	aliasDefinitionsFileNames.map(function (aliasDefinitionsFileName) {
		return readFileSync(join(brjsProjectRoot, aliasDefinitionsFileName), "utf8");
	}).map(function (aliasDefinitionsFile) {
		return parse(aliasDefinitionsFile);
	}).forEach(function (aliasDefinitionsXMLDoc) {
		var aliasDefinitionElements = aliasDefinitionsXMLDoc.findall("./alias");

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = aliasDefinitionElements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var aliasDefinitionElement = _step.value;

				applicationAliases.add(aliasDefinitionElement.get("name"));
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator["return"]) {
					_iterator["return"]();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}
	});

	return applicationAliases;
}