import {unlink} from 'fs';
import {join} from 'path';

import {List} from 'immutable';
import vinylFs from 'vinyl-fs';
import through2 from 'through2';

import {
	createRemoveGlobalizeSourceModulesCallVisitor,
	requireFixturesVisitor,
	wrapModuleInIIFEVisitor,
	flattenProgramIIFEVisitor
} from '../../global-compiler';

import {
	addAliasRequires,
	parseJSFile,
	transformSLJSUsage,
	convertASTToBuffer,
	transformI18nUsage,
	addRequiresForLibraries,
	removeCJSModuleRequires,
	convertGlobalsToRequires,
	expandVarNamespaceAliases,
	pruneRedundantRequires,
	replaceLibraryIncludesWithRequires
} from './common-transforms';
import {compileSourceFiles} from './src-files-compiler';
import {NO_OP, transformASTAndPushToNextStream} from './utils/utilities';

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
	options.libraryIdentifiersToRequire.set(List.of('SL4B_Accessor'), 'sl4bdummy->SL4B_Accessor');
	options.libraryIdentifiersToRequire.set(List.of('assertFails'), 'jsunitextensions->assertFails');
	options.libraryIdentifiersToRequire.set(List.of('assertAssertError'), 'jsunitextensions->assertAssertError');
	options.libraryIdentifiersToRequire.set(List.of('assertNoException'), 'jsunitextensions->assertNoException');
	options.libraryIdentifiersToRequire.set(List.of('assertArrayEquals'), 'jsunitextensions->assertArrayEquals');
	options.libraryIdentifiersToRequire.set(List.of('assertVariantEquals'), 'jsunitextensions->assertVariantEquals');
	options.libraryIdentifiersToRequire.set(List.of('assertMapEquals'), 'jsunitextensions->assertMapEquals');
	options.libraryIdentifiersToRequire.set(List.of('triggerKeyEvent'), 'jsunitextensions->triggerKeyEvent');
	options.libraryIdentifiersToRequire.set(List.of('triggerMouseEvent'), 'jsunitextensions->triggerMouseEvent');
	options.libraryIdentifiersToRequire.set(List.of('Clock'), 'jsunitextensions->Clock');
	options.libraryIdentifiersToRequire.set(List.of('ApiProtector'), 'jstestdriverextensions->ApiProtector');
	options.libraryIdentifiersToRequire.set(List.of('CaplinTestCase'), 'jstestdriverextensions->CaplinTestCase');
	options.libraryIdentifiersToRequire.set(List.of('defineTestCase'), 'jstestdriverextensions->defineTestCase');
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
	transformASTAndPushToNextStream(fileMetadata, requireFixturesVisitor, callback);
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
	const removeGlobalizeSourceModulesCallVisitor = createRemoveGlobalizeSourceModulesCallVisitor();

	transformASTAndPushToNextStream(fileMetadata, removeGlobalizeSourceModulesCallVisitor, callback);
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
	transformASTAndPushToNextStream(fileMetadata, flattenProgramIIFEVisitor, callback);
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
	transformASTAndPushToNextStream(fileMetadata, wrapModuleInIIFEVisitor, callback);
}

/**
 * @param {OptionsObject} options - Options to configure transforms.
 * @returns {Stream}
 */
export function compileTestFiles(options) {
	registerCaplinTestGlobals(options);

	const outputDirectory = options.outputDirectory;

	return vinylFs
		.src([options.filesToCompile, '!**/bundle.js'])
		.pipe(parseJSFile())
		.pipe(through2.obj(removeGlobalizeSourceModulesCall))
		.pipe(through2.obj(flattenProgramIIFE))
		.pipe(expandVarNamespaceAliases(options.namespaces))
		.pipe(addAliasRequires(options.applicationAliases))
		.pipe(transformSLJSUsage())
		.pipe(convertGlobalsToRequires(options.namespaces, false))
		.pipe(removeCJSModuleRequires(options.moduleIDsToRemove))
		.pipe(addRequiresForLibraries(options.libraryIdentifiersToRequire))
		.pipe(transformI18nUsage())
		.pipe(replaceLibraryIncludesWithRequires(options.libraryIncludesToRequire, options.libraryIncludeIterable))
		.pipe(pruneRedundantRequires())
		.pipe(through2.obj(requireFixtures))
		.pipe(through2.obj(wrapModuleInIIFE))
		.pipe(convertASTToBuffer())
		.pipe(vinylFs.dest(options.outputDirectory))
		.on('end', () => {
			unlink(join(outputDirectory, '.js-style'), NO_OP);
		});
}

/**
 * @param {OptionsObject} optionsObject - Options to configure transforms.
 */
export function compileTestAndSrcTestFiles(optionsObject) {
	const testConversionStream = compileTestFiles(optionsObject);

	testConversionStream.on('end', () => {
		optionsObject.filesToCompile = 'src-test/**/*.js';
		optionsObject.outputDirectory = 'src-test';
		compileSourceFiles(optionsObject);
	});
}
