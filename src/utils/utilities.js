var path = require('path');

var chalk = require('chalk');
var visit = require('ast-types').visit;

/**
 * File metadata consists of a Vinyl file and an AST property.
 *
 * @typedef {Object} FileMetadata
 * @property {Object} ast - Code AST.
 * @property {String} path - File path.
 * @property {String} base - File base, path without file name.
 */

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @param {Object} visitor - AST visitor.
 * @param {Object} streamTransform - Stream transform instance.
 * @param {Function} callback - Used to flush data down the stream.
 */
export function transformASTAndPushToNextStream(fileMetadata, visitor, streamTransform, callback) {
	try {
		visit(fileMetadata.ast, visitor);
	} catch (error) {
		console.error(chalk.red(error));
		callback(error);
	}

	streamTransform.push(fileMetadata);
	callback();
}

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @returns {string} File namespace, namespace parts separated by '.'.
 */
export function getFileNamespace(fileMetadata) {
	return getFileNamespaceParts(fileMetadata).join('.');
}

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @returns {Array} File namespace parts.
 */
export function getFileNamespaceParts(fileMetadata) {
	return fileMetadata.relative.replace(/\.js$/, '').split(path.sep);
}
