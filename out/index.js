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
function compileFile($__5) {
  var fileLocation = $traceurRuntime.assertObject($__5)[0];
  var filePath = join(process.cwd(), fileLocation);
  var fileContents = readFileSync(filePath);
  var ast = parse(fileContents);
  var programStatements = ast.program.body;
  for (var $__3 = programStatements[Symbol.iterator](),
      $__4; !($__4 = $__3.next()).done; ) {
    var programStatement = $__4.value;
    {
      t(programStatement);
    }
  }
}
function t(astNode) {
  if (astNode.type === 'ExpressionStatement') {
    var topLevelExpression = astNode.expression;
    if (topLevelExpression.type === 'AssignmentExpression') {
      var memberExpression = topLevelExpression.left;
      console.log(memberExpression);
    }
  }
}
