"use strict";
Object.defineProperties(exports, {
  flattenNamespace: {get: function() {
      return flattenNamespace;
    }},
  __esModule: {value: true}
});
var builders = require('ast-types').builders;
function flattenNamespace(programNode, fullyQualifiedName) {
  fullyQualifiedName = fullyQualifiedName.split('.');
  programNode.body = programNode.body.map((function(programStatement) {
    var $__1 = $traceurRuntime.assertObject(programStatement),
        type = $__1.type,
        expression = $__1.expression;
    if (type === 'ExpressionStatement' && expression.type === 'AssignmentExpression') {
      return flattenIfNamespaced(programStatement, fullyQualifiedName);
    }
    return programStatement;
  }));
}
function flattenIfNamespaced(expressionStatement, fullyQualifiedName) {
  var expression = $traceurRuntime.assertObject(expressionStatement).expression;
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  if (isNamespacedConstructorMemberExpression(expression.left, fullyQualifiedName)) {
    return createConstructorFunctionDeclaration(expressionStatement, className);
  } else if (true) {
    flattenClassMethod(expression, className, 'myMethod');
    return expressionStatement;
  }
}
function isNamespacedConstructorMemberExpression(assignmentLeftExpression, fullyQualifiedName) {
  return fullyQualifiedName.reduceRight(isNamespacedClassConstructor, assignmentLeftExpression);
}
function isNamespacedClassConstructor(expression, namespacePart) {
  if (typeof expression === 'boolean') {
    return false;
  } else if (expression.type === 'Identifier' && expression.name === namespacePart) {
    return true;
  } else if (expression.type === 'MemberExpression' && expression.property.name === namespacePart) {
    return expression.object;
  }
  return false;
}
function createConstructorFunctionDeclaration(expressionStatement, className) {
  var functionExpression = $traceurRuntime.assertObject($traceurRuntime.assertObject(expressionStatement).expression).right;
  var classConstructorDeclaration = builders.functionDeclaration(builders.identifier(className), functionExpression.params, functionExpression.body);
  return classConstructorDeclaration;
}
function flattenClassMethod(assignmentExpression, className, methodName) {
  var classProto = builders.memberExpression(builders.identifier(className), builders.identifier('prototype'), false);
  var classMethod = builders.memberExpression(classProto, builders.identifier(methodName), false);
  assignmentExpression.left = classMethod;
}
