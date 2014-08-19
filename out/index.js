"use strict";
Object.defineProperties(exports, {
  compileFile: {get: function() {
      return compileFile;
    }},
  __esModule: {value: true}
});
var $__transforms_47_flatten__,
    $__transforms_47_rootnstocjs__;
var join = require('path').join;
var readFileSync = require('fs').readFileSync;
var minimist = require('minimist');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('ast-types').visit;
var NamespacedClassVisitor = ($__transforms_47_flatten__ = require("./transforms/flatten"), $__transforms_47_flatten__ && $__transforms_47_flatten__.__esModule && $__transforms_47_flatten__ || {default: $__transforms_47_flatten__}).NamespacedClassVisitor;
var RootNamespaceVisitor = ($__transforms_47_rootnstocjs__ = require("./transforms/rootnstocjs"), $__transforms_47_rootnstocjs__ && $__transforms_47_rootnstocjs__.__esModule && $__transforms_47_rootnstocjs__ || {default: $__transforms_47_rootnstocjs__}).RootNamespaceVisitor;
function compileFile(options) {
  var args = minimist(options);
  var fileLocation = args._[0];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  if (args.flatten) {
    var namespacedClassVisitor = new NamespacedClassVisitor(args.flatten);
    visit(ast.program, namespacedClassVisitor);
  } else if (args.rootnstocjs) {
    var rootNsVisitor = new RootNamespaceVisitor(args.rootnstocjs, ast.program.body);
    visit(ast.program, rootNsVisitor);
    rootNsVisitor.insertRequires();
  }
  return print(ast).code;
}
