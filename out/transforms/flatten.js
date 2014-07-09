"use strict";
Object.defineProperties(exports, {
  flattenNamespace: {get: function() {
      return flattenNamespace;
    }},
  __esModule: {value: true}
});
var builders = require('ast-types').builders;
function flattenNamespace($__3, fullyQualifiedName) {
  var programStatements = $traceurRuntime.assertObject($__3).body;
  var namespace = ['my', 'long', 'name', 'space', 'SimpleClass'];
  for (var $__1 = programStatements[Symbol.iterator](),
      $__2; !($__2 = $__1.next()).done; ) {
    var programStatement = $__2.value;
    {
      flattenNamespacedJsClass(programStatement, namespace);
    }
  }
}
function flattenNamespacedJsClass($__3, namespace) {
  var $__4 = $traceurRuntime.assertObject($__3),
      type = $__4.type,
      expression = $__4.expression;
  if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
    if (isNamespacedConstructorMemberExpression(expression.left, namespace)) {
      flattenClassConstructor(expression, namespace);
    }
  }
}
function isNamespacedConstructorMemberExpression(assignmentLeftExpression, fullyQualifiedName) {
  fullyQualifiedName.reduceRight(isNamespacedClassConstructor, assignmentLeftExpression);
  return true;
}
function flattenClassConstructor(assignmentExpression, fullyQualifiedName) {
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  assignmentExpression.left = builders.identifier(className);
}
function isNamespacedClassConstructor() {}
