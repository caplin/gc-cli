var fs = require('fs');

var through2 = require('through2');
var bluebird = require('bluebird');
var parse = require('recast').parse;
var visit = require('ast-types').visit;
var globStream = require('glob-stream');
import {NamespacedClassVisitor} from 'global-compiler';

var readFile = bluebird.promisify(fs.readFile);

/**
 * @param {Array} options - List of options for CLI.
 */
export function processFile(options) {
	globStream.create('src/**/*.js')
		.pipe(through2.obj(readAndParseJsFile))
		.pipe(flattenClass());

//	stream.on('data', function() {
//		console.log(arguments);
//	});
	
//	var sourceFiles = glob.sync('src/**/*.js');
//	var filesMetadata = sourceFiles.map(generateFileMetadata);
//	var processedFiles = filesMetadata.map(fileMetadata => {
//		return compileFile(['--flatten', fileMetadata.namespace, fileMetadata.fileName]);
//	});
//				'--flatten',
//			'my.long.name.space.SimpleClass',
//			'test/flatten/given.js'
	
//	console.log(processedFiles[0]);
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

function flattenClass() {
	return through2.obj((fileMetadata, encoding, callback) => {

		console.log(fileMetadata);
//		var namespacedClassVisitor = new NamespacedClassVisitor(args.flatten);

//		visit(ast.program, namespacedClassVisitor);
	});
}

function generateFileMetadata(fileName) {
	var namespace = fileName
						.replace(/^src\//, '')
						.replace(/\.js$/, '')
						.replace(/\//g, '.');

	return {namespace, fileName};
}
