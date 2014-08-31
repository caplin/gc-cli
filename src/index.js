var fs = require('fs');

var through2 = require('through2');
var globStream = require('glob-stream');

/**
 * @param {Array} options - List of options for CLI.
 */
export function processFile(options) {
	var stream = globStream.create('src/**/*.js')
		.pipe(createJsAst());

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

function createJsAst() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		console.log(fileMetadata);
		
		fs.readFile(fileMetadata.path, (error, data) => {
		});

		this.push(data);

		callback();
	});
}
	
//function generateFileMetadata(fileName) {
//	var namespace = fileName
//						.replace(/^src\//, '')
//						.replace(/\.js$/, '')
//						.replace(/\//g, '.');
//
//	return {namespace, fileName};
//}

function generateFileMetadata(fileName) {
	var namespace = fileName
						.replace(/^src\//, '')
						.replace(/\.js$/, '')
						.replace(/\//g, '.');

	return {namespace, fileName};
}