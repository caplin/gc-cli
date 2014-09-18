var gulp = require('gulp');
var eslint = require('eslint');
var through2 = require('through2');
var gulpMocha = require('gulp-mocha');
var ESLintConfig = require('eslint/lib/config');

var sourceFiles = 'src/**/*.js';

gulp.task('test', function() {
	gulp.src('test/*.js', {read: false})
		.pipe(gulpMocha());
});

gulp.task('lint', function() {
	gulp.src(sourceFiles)
		.pipe(ex());
});

gulp.task('watch', function() {
	gulp.watch(sourceFiles, ['test']);
});

//ESLint's esprima currently doesn't parse ES6 so this will always error.
function ex() {
	return through2.obj(function(vinylFile, encoding, callback) {
		var config = new ESLintConfig();
		var fileContents = vinylFile.contents.toString();
		var messages = eslint.linter.verify(fileContents, config, vinylFile.relative);

		console.log(vinylFile.relative, messages);

		callback();
	});
}
