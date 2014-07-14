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
function compileFile(options) {
  var args = minimist(options);
  var fileLocation = args._[0];
  var namespace = args.flatten;
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  flattenNamespace(ast.program, namespace);
  console.log(print(ast).code);
  return print(ast).code;
}
