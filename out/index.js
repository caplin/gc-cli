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
var builders = require('ast-types').builders;
function compileFile($__6) {
  var fileLocation = $traceurRuntime.assertObject($__6)[0];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  var programStatements = ast.program.body;
  for (var $__4 = programStatements[Symbol.iterator](),
      $__5; !($__5 = $__4.next()).done; ) {
    var programStatement = $__5.value;
    {
      flattenNamespacedJsClass(programStatement);
    }
  }
  console.log(print(ast).code);
}
function flattenNamespacedJsClass(astNode) {
  if (astNode.type === 'ExpressionStatement') {
    var topLevelExpression = astNode.expression;
    if (topLevelExpression.type === 'AssignmentExpression') {
      topLevelExpression.left = builders.identifier("SimpleClass");
    }
  }
}
function flattenClassConstructor() {}
