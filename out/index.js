"use strict";
Object.defineProperties(exports, {
  namespacedClassVisitor: {get: function() {
      return namespacedClassVisitor;
    }},
  rootNamespaceVisitor: {get: function() {
      return rootNamespaceVisitor;
    }},
  compileFile: {get: function() {
      return compileFile;
    }},
  __esModule: {value: true}
});
var $__transforms_47_flatten__,
    $__transforms_47_rootnstocjs__;
var join = require('path').join;
var readFileSync = require('fs').readFileSync;
var parseArgs = require('minimist');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
var namespacedClassVisitor = ($__transforms_47_flatten__ = require("./transforms/flatten"), $__transforms_47_flatten__ && $__transforms_47_flatten__.__esModule && $__transforms_47_flatten__ || {default: $__transforms_47_flatten__}).namespacedClassVisitor;
var rootNamespaceVisitor = ($__transforms_47_rootnstocjs__ = require("./transforms/rootnstocjs"), $__transforms_47_rootnstocjs__ && $__transforms_47_rootnstocjs__.__esModule && $__transforms_47_rootnstocjs__ || {default: $__transforms_47_rootnstocjs__}).rootNamespaceVisitor;
;
function compileFile(options) {
  var args = parseArgs(options);
  var fileLocation = args._[0];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  if (args.flatten) {
    namespacedClassVisitor.initialize(args.flatten);
    visit(ast, namespacedClassVisitor);
  } else if (args.rootnstocjs) {
    rootNamespaceVisitor.initialize(args.rootnstocjs, ast.program.body);
    visit(ast, rootNamespaceVisitor);
  }
  return print(ast).code;
}
