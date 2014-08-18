"use strict";
Object.defineProperties(exports, {
  compileFile: {get: function() {
      return compileFile;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__fs__,
    $__recast__,
    $__ast_45_types__,
    $__transforms_47_flatten__,
    $__transforms_47_rootnstocjs__;
var join = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).join;
var readFileSync = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).readFileSync;
var $__2 = ($__recast__ = require("recast"), $__recast__ && $__recast__.__esModule && $__recast__ || {default: $__recast__}),
    parse = $__2.parse,
    print = $__2.print;
var visit = ($__ast_45_types__ = require("ast-types"), $__ast_45_types__ && $__ast_45_types__.__esModule && $__ast_45_types__ || {default: $__ast_45_types__}).visit;
var minimist = require('minimist');
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
