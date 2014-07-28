"use strict";
Object.defineProperties(exports, {
  compileFile: {get: function() {
      return compileFile;
    }},
  __esModule: {value: true}
});
var join = require('path').join;
var readFileSync = require('fs').readFileSync;
var $__2 = require('recast'),
    parse = $__2.parse,
    print = $__2.print;
var minimist = require('minimist');
var flattenNamespace = require('./transforms/flatten').flattenNamespace;
var RootNamespaceVisitor = require('./transforms/rootnstocjs').RootNamespaceVisitor;
function compileFile(options) {
  var args = minimist(options);
  var fileLocation = args._[0];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  if (args.flatten) {
    var namespace = args.flatten;
    flattenNamespace(ast.program, namespace);
  } else if (args.rootnstocjs) {
    var rootNsVisitor = new RootNamespaceVisitor(args.rootnstocjs, ast.program.body);
    rootNsVisitor.visit(ast);
    rootNsVisitor.insertRequires();
  }
  return print(ast).code;
}
