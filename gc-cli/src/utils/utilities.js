import {
	readdirSync,
	readFileSync
} from 'fs';
import {
	dirname,
	join,
	sep
} from 'path';

import {
	parse
} from 'elementtree';
import {
	sync
} from 'glob';
import {
	safeLoad
} from 'js-yaml';
import {
	visit
} from 'recast';
import {
	error
} from 'winston';

export function NO_OP() {
	// Ignored callback.
}

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @param {Object} visitor - AST visitor.
 * @param {Function} callback - Used to flush data down the stream.
 * @return {undefined}
 */
export function transformASTAndPushToNextStream(fileMetadata, visitor, callback) {
	try {
		visit(fileMetadata.ast, visitor);
	} catch (visitorError) {
		error(visitor);
		error(fileMetadata);
		error(visitorError);

		return callback(visitorError);
	}

	return callback(null, fileMetadata);
}

// if a `br-lib.conf` YAML file exists read it and extract its `requirePrefix`.
function getNamespacePrefixParts() {
	const brLibFileName = join(process.cwd(), 'br-lib.conf');

	try {
		const brLibYAML = safeLoad(readFileSync(brLibFileName, 'utf8'));

		return brLibYAML.requirePrefix.split('/');
	} catch (noBRLibConfFileError) {
		// Ignore.
	}

	return [];
}

/**
 * @param {FileMetadata} fileMetadata - File metadata for file being visited.
 * @returns {string} File namespace, namespace parts separated by '.'.
 */
export function getFileNamespace(fileMetadata) {
	const namespacePrefixParts = getNamespacePrefixParts();

	return namespacePrefixParts.concat(getFileNamespaceParts(fileMetadata)).join('.');
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

/**
 * Finds all the aliases defined/available in an application.
 *
 * @return {Set<string>}
 */
export function findApplicationAliases() {
	const brjsProjectRoot = findBRJSProjectRoot();

	return gatherApplicationAliases(brjsProjectRoot);
}

function findBRJSProjectRoot() {
	let current = process.cwd();
	let currentDirectoryContents = readdirSync(current);

	while (currentDirectoryContents.includes('apps') === false &&
		currentDirectoryContents.includes('sdk') === false && current !== dirname(current)) {
		current = dirname(current);
		currentDirectoryContents = readdirSync(current);
	}

	return current;
}

function gatherApplicationAliases(brjsProjectRoot) {
	const aliasDefinitionsFileNames = sync('**/aliasDefinitions.xml', {cwd: brjsProjectRoot});
	const applicationAliases = new Set();

	aliasDefinitionsFileNames
		.map((aliasDefinitionsFileName) => readFileSync(join(brjsProjectRoot, aliasDefinitionsFileName), 'utf8'))
		.map((aliasDefinitionsFile) => parse(aliasDefinitionsFile))
		.forEach((aliasDefinitionsXMLDoc) => {
			const aliasDefinitionElements = aliasDefinitionsXMLDoc.findall('./alias');

			for (const aliasDefinitionElement of aliasDefinitionElements) {
				applicationAliases.add(aliasDefinitionElement.get('name'));
			}
		});

	return applicationAliases;
}
