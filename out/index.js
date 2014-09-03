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
var print = require('recast').print;
var visit = require('ast-types').visit;
var globStream = require('glob-stream');
var NamespacedClassVisitor = require('global-compiler').NamespacedClassVisitor;
var readFile = bluebird.promisify(fs.readFile);
function processFile() {
  globStream.create('src/**/*.js').pipe(through2.obj(readAndParseJsFile)).pipe(through2.obj(flattenClass)).pipe(through2.obj(convertAstToBuffer));
}
var readAndParseJsFile = bluebird.coroutine($traceurRuntime.initGeneratorFunction(function $__2(fileMetadata, encoding, callback) {
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
  }, $__2, this);
}));
function flattenClass(fileMetadata, encoding, callback) {
  var $__1 = $traceurRuntime.assertObject(fileMetadata),
      filePath = $__1.path,
      fileBase = $__1.base,
      ast = $__1.ast;
  var fileName = filePath.replace(fileBase, '');
  var classNamespace = fileName.replace(/\.js$/, '').replace(/\//g, '.');
  var namespacedClassVisitor = new NamespacedClassVisitor(classNamespace);
  visit(ast, namespacedClassVisitor);
  this.push(fileMetadata);
  callback();
}
function convertAstToBuffer(fileMetadata, encoding, callback) {
  var convertedCode = print(fileMetadata.ast).code;
  var convertedCodeBuffer = new Buffer(convertedCode);
  fileMetadata.contents = convertedCodeBuffer;
  this.push(fileMetadata);
  callback();
}
