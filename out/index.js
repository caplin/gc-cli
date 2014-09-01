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
var readAndParseJsFile = bluebird.coroutine($traceurRuntime.initGeneratorFunction(function $__1(fileMetadata, encoding, callback) {
  var fileContent,
      fileAst,
      error;
  return $traceurRuntime.createGeneratorInstance(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          $ctx.pushTry(7, null);
          $ctx.state = 10;
          break;
        case 10:
          $ctx.state = 2;
          return readFile(fileMetadata.path);
        case 2:
          fileContent = $ctx.sent;
          $ctx.state = 4;
          break;
        case 4:
          fileAst = parse(fileContent);
          fileMetadata.ast = fileAst;
          this.push(fileMetadata);
          callback();
          $ctx.state = 6;
          break;
        case 6:
          $ctx.popTry();
          $ctx.state = -2;
          break;
        case 7:
          $ctx.popTry();
          error = $ctx.storedException;
          $ctx.state = 13;
          break;
        case 13:
          callback(null, error);
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, $__1, this);
}));
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
