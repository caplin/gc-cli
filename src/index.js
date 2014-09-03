var fs = require('fs');

var through2 = require('through2');
var bluebird = require('bluebird');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
var globStream = require('glob-stream');
import {NamespacedClassVisitor} from 'global-compiler';

var readFile = bluebird.promisify(fs.readFile);

/**
 *
 */
export function processFile() {
	globStream.create('src/**/*.js')
		.pipe(through2.obj(readAndParseJsFile))
		.pipe(through2.obj(flattenClass))
		.pipe(through2.obj(convertAstToBuffer));
}

var readAndParseJsFile = bluebird.coroutine(function* (fileMetadata, encoding, callback) {
	try {
		var fileContent = yield readFile(fileMetadata.path);
		var fileAst = parse(fileContent);

		fileMetadata.ast = fileAst;
		this.push(fileMetadata);

		callback();
	} catch (error) {
		callback(null, error);
	}
});

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
function convertAstToBuffer(fileMetadata, encoding, callback) {
	var convertedCode = print(fileMetadata.ast).code;
	var convertedCodeBuffer = new Buffer(convertedCode);

	fileMetadata.contents = convertedCodeBuffer;

	this.push(fileMetadata);

	callback();
}
