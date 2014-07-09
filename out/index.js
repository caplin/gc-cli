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
var flattenNamespace = require('./transforms/flatten').flattenNamespace;
function compileFile($__4) {
  var $__5 = $traceurRuntime.assertObject($__4),
      fileLocation = $__5[0],
      fullyQualifiedName = $__5[1];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  flattenNamespace(ast.program);
  console.log(print(ast).code);
}
