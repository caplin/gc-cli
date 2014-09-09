var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
import {
	RootNamespaceVisitor,
	NamespacedClassVisitor
} from 'global-compiler';

/**
 *
 */
export function processFile() {
	vinylFs.src('src/**/*.js')
		.pipe(through2.obj(parseJsFile))
		.pipe(through2.obj(flattenClass))
		.pipe(through2.obj(convertGlobalsToRequires))
		.pipe(through2.obj(convertAstToBuffer))
		.pipe(vinylFs.dest('./output'));
}

/**
 * Stream transform implementation (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} vinylFile - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Function to call (takes optional error argument) when processing the supplied object is complete.
 */
function parseJsFile(vinylFile, encoding, callback) {
	var fileAst = parse(vinylFile.contents.toString());

	vinylFile.ast = fileAst;
	this.push(vinylFile);

	callback();
}

/**
 * Stream transform implementation (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Function to call (takes optional error argument) when processing the supplied object is complete.
 */
function flattenClass(fileMetadata, encoding, callback) {
	var {path: filePath, base: fileBase, ast} = fileMetadata;
	var fileName = filePath.replace(fileBase, '');
	var classNamespace = fileName.replace(/\.js$/, '').replace(/\//g, '.');
	var namespacedClassVisitor = new NamespacedClassVisitor(classNamespace);

	visit(ast, namespacedClassVisitor);

	this.push(fileMetadata);

	callback();
}

/**
 * Stream transform implementation (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Function to call (takes optional error argument) when processing the supplied object is complete.
 */
function convertGlobalsToRequires(fileMetadata, encoding, callback) {
	var ast = fileMetadata.ast;
	//TODO: hardcoded
	var rootNamespaceVisitor = new RootNamespaceVisitor('my', ast.program.body);

	visit(ast, rootNamespaceVisitor);

	this.push(fileMetadata);

	callback();
}

/**
 * Stream transform implementation (http://nodejs.org/docs/latest/api/stream.html#stream_transform_transform_chunk_encoding_callback).
 *
 * @param {?} fileMetadata - .
 * @param {String} encoding - If the chunk is a string, then this is the encoding type.
 * @param {Function} callback - Function to call (takes optional error argument) when processing the supplied object is complete.
 */
function convertAstToBuffer(fileMetadata, encoding, callback) {
	var convertedCode = print(fileMetadata.ast).code;
	var convertedCodeBuffer = new Buffer(convertedCode);

	fileMetadata.contents = convertedCodeBuffer;

	this.push(fileMetadata);

	callback();
}
