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
  var namespace = ['my', 'long', 'name', 'space', 'SimpleClass'];
  for (var $__4 = programStatements[Symbol.iterator](),
      $__5; !($__5 = $__4.next()).done; ) {
    var programStatement = $__5.value;
    {
      flattenNamespacedJsClass(programStatement, namespace);
    }
  }
  console.log(print(ast).code);
}
function flattenNamespacedJsClass($__6, namespace) {
  var $__7 = $traceurRuntime.assertObject($__6),
      type = $__7.type,
      expression = $__7.expression;
  if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
    if (isNamespacedConstructorMemberExpression(expression.left, namespace)) {
      flattenClassConstructor(expression, namespace);
    }
  }
}
function isNamespacedConstructorMemberExpression(assignmentLeftExpression, fullyQualifiedName) {
  return true;
}
function flattenClassConstructor(assignmentExpression, fullyQualifiedName) {
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  assignmentExpression.left = builders.identifier(className);
}
