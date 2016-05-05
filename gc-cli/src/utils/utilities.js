import {sep} from 'path';

import {visit} from 'recast';

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @param {Object} visitor - AST visitor.
 * @param {Object} streamTransform - Stream transform instance.
 * @param {Function} callback - Used to flush data down the stream.
 * @return {undefined}
 */
export function transformASTAndPushToNextStream(fileMetadata, visitor, streamTransform, callback) {
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

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @returns {string} File namespace, namespace parts separated by '.'.
 */
export function getFileNamespace(fileMetadata) {
	return getFileNamespaceParts(fileMetadata).join('.');
}

/**
 * @param {FileMetadata} fileMetadata File metadata for file being visited, a Vinyl File object
 * @returns {Array} File namespace parts.
 */
export function getFileNamespaceParts(fileMetadata) {
	// The cwd is the blade/libs directory (where the user should be invoking the CLI) and the path
	// is the absolute path to the JS file. Stripping away one from the other returns the relative
	// path to the JS file.
	const filePathRelativeToCWD = fileMetadata.path.replace(fileMetadata.cwd, '');
	// Namespaced files are only present in src files so we need to remove the src prefix from the
	// file path. Test files aren't namespaced so this function isn't called by the test transform
	const filePathWithoutSrc = filePathRelativeToCWD
		.replace(`${sep}src${sep}`, '')
		.replace(`${sep}src-test${sep}`, '');

	// Remove the JS file suffix and break up the path string by directory separator
	return filePathWithoutSrc.replace(/\.js$/, '').split(sep);
}
