var path = require('path');

var chalk = require('chalk');
var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
import {
	rootNamespaceVisitor,
	namespacedClassVisitor
} from 'global-compiler';

/**
 * Vinyl file.
 *
 * @typedef {Object} VinylFile
 * @property {String} path - File path.
 * @property {String} base - File base, path without file name.
 */

/**
 *
 */
export function processFile() {
	vinylFs.src('src/**/*.js')
		.pipe(through2.obj(parseJsFile))
		.pipe(through2.obj(flattenClass))
		.pipe(through2.obj(convertGlobalsToRequires))
		.pipe(through2.obj(convertAstToBuffer))
		//TODO: hardcoded
		.pipe(vinylFs.dest('./output'));
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {VinylFile} vinylFile - Virtual file object.
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function parseJsFile(vinylFile, encoding, callback) {
	console.log(chalk.green('Parsing', vinylFile.path));
	var fileAst = parse(vinylFile.contents.toString());

	vinylFile.ast = fileAst;
	this.push(vinylFile);

	callback();
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function flattenClass(fileMetadata, encoding, callback) {
	var fileSepRegExp = new RegExp('\\' + path.sep, 'g');
	var {path: filePath, base: fileBase, ast} = fileMetadata;
	var fileName = filePath.replace(fileBase, '');
	var classNamespace = fileName.replace(/\.js$/, '').replace(fileSepRegExp, '.');

	namespacedClassVisitor.initialize(classNamespace);

	visit(ast, namespacedClassVisitor);

	this.push(fileMetadata);

	callback();
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function convertGlobalsToRequires(fileMetadata, encoding, callback) {
	var ast = fileMetadata.ast;
	//TODO: hardcoded
	rootNamespaceVisitor.initialize('my', ast.program.body);

	visit(ast, rootNamespaceVisitor);

	this.push(fileMetadata);

	callback();
}

/**
 * Stream transform implementation.
 * (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Called (takes optional error argument) when processing the supplied object is complete.
 */
function convertAstToBuffer(fileMetadata, encoding, callback) {
	var convertedCode = print(fileMetadata.ast).code;
	var convertedCodeBuffer = new Buffer(convertedCode);

	fileMetadata.contents = convertedCodeBuffer;

	this.push(fileMetadata);

	callback();
}
