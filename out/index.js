"use strict";
Object.defineProperties(exports, {
  processFile: {get: function() {
      return processFile;
    }},
  __esModule: {value: true}
});
var fs = require('fs');
var through2 = require('through2');
var bluebird = require('bluebird');
var parse = require('recast').parse;
var visit = require('ast-types').visit;
var globStream = require('glob-stream');
var NamespacedClassVisitor = require('global-compiler').NamespacedClassVisitor;
var readFile = bluebird.promisify(fs.readFile);
function processFile(options) {
  globStream.create('src/**/*.js').pipe(through2.obj(readAndParseJsFile)).pipe(flattenClass());
}
function readAndParseJsFile(fileMetadata, encoding, callback) {
  var $__1 = this;
  readFile(fileMetadata.path).then((function(fileContent) {
    var fileAst = parse(fileContent);
    fileMetadata.ast = fileAst;
    $__1.push(fileMetadata);
    callback();
  })).catch((function(error) {
    callback(null, error);
  }));
}
function flattenClass() {
  return through2.obj((function(fileMetadata, encoding, callback) {
    console.log(fileMetadata);
  }));
}
function generateFileMetadata(fileName) {
  var namespace = fileName.replace(/^src\//, '').replace(/\.js$/, '').replace(/\//g, '.');
  return {
    namespace: namespace,
    fileName: fileName
  };
}
