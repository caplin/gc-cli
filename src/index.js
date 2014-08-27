var glob = require('glob');
import {compileFile} from 'global-compiler';

/**
 * @param {Array} options - List of options for CLI.
 */
export function processFile(options) {
	var files = glob.sync('src/**/*.js');

	console.log(files);
}