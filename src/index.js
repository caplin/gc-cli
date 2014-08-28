var glob = require('glob');
import {compileFile} from 'global-compiler';

/**
 * @param {Array} options - List of options for CLI.
 */
export function processFile(options) {
	var sourceFiles = glob.sync('src/**/*.js');
	var filesMetadata = sourceFiles.map(generateFileMetadata);
	var processedFiles = filesMetadata.map(fileMetadata => {
//		console.log(fileMetadata.namespace, fileMetadata.fileName);

		return compileFile(['--flatten', fileMetadata.namespace, fileMetadata.fileName]);
	});
//				'--flatten',
//			'my.long.name.space.SimpleClass',
//			'test/flatten/given.js'
	
	console.log(processedFiles[0]);
}

function generateFileMetadata(fileName) {
	var namespace = fileName
						.replace(/^src\//, '')
						.replace(/\.js$/, '')
						.replace(/\//g, '.');

	return {namespace, fileName};
}