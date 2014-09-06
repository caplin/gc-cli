"use strict";
Object.defineProperties(exports, {
  processFile: {get: function() {
      return processFile;
    }},
  __esModule: {value: true}
});
var fs = require('fs');
var vinylFs = require('vinyl-fs');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
var $__0 = require('global-compiler'),
    RootNamespaceVisitor = $__0.RootNamespaceVisitor,
    NamespacedClassVisitor = $__0.NamespacedClassVisitor;
function processFile() {
  vinylFs.src('src/**/*.js').pipe(through2.obj(parseJsFile)).pipe(through2.obj(flattenClass)).pipe(through2.obj(convertGlobalsToRequires)).pipe(through2.obj(convertAstToBuffer));
}
function parseJsFile(vinylFile, encoding, callback) {
  var fileAst = parse(vinylFile.content);
  vinylFile.ast = fileAst;
  this.push(vinylFile);
  callback();
}
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
function convertGlobalsToRequires(fileMetadata, encoding, callback) {
  var ast = fileMetadata.ast;
  var rootNamespaceVisitor = new RootNamespaceVisitor('my', ast.program.body);
  visit(ast, rootNamespaceVisitor);
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
