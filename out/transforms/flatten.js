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
    if (programStatement.type === 'ExpressionStatement') {
      return flattenExpressionStatement(programStatement, fullyQualifiedName);
    }
    return programStatement;
  }));
}
function flattenExpressionStatement(programStatement, fullyQualifiedName) {
  var $__1 = $traceurRuntime.assertObject(programStatement),
      type = $__1.type,
      expression = $__1.expression;
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  if (expression.type === 'AssignmentExpression') {
    return flattenIfNamespaced(programStatement, fullyQualifiedName);
  } else if (expression.type === 'CallExpression') {
    flattenCallExpressionArguments(expression.arguments, fullyQualifiedName, className);
  }
  return programStatement;
}
function flattenIfNamespaced(expressionStatement, fullyQualifiedName) {
  var assignmentExpression = $traceurRuntime.assertObject(expressionStatement).expression;
  var assignmentLeftExpression = assignmentExpression.left;
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  if (isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName)) {
    flattenClassMethod(assignmentExpression, className);
  } else if (isNamespacedExpression(assignmentLeftExpression, fullyQualifiedName)) {
    return createConstructorFunctionDeclaration(expressionStatement, className);
  }
  return expressionStatement;
}
function isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName) {
  var fullyQualifiedMethod = Array.from(fullyQualifiedName).concat('prototype', '*');
  return fullyQualifiedMethod.reduceRight(isNamespacedClassExpression, assignmentLeftExpression);
}
function isNamespacedExpression(assignmentLeftExpression, fullyQualifiedName) {
  return fullyQualifiedName.reduceRight(isNamespacedClassExpression, assignmentLeftExpression);
}
function isNamespacedClassExpression(expression, namespacePart) {
  if (typeof expression === 'boolean') {
    return false;
  } else if (expression.type === 'Identifier' && expression.name === namespacePart) {
    return true;
  } else if (expression.type === 'MemberExpression' && (expression.property.name === namespacePart || namespacePart === '*')) {
    return expression.object;
  }
  return false;
}
function flattenClassMethod(assignmentExpression, className) {
  var methodName = $traceurRuntime.assertObject($traceurRuntime.assertObject($traceurRuntime.assertObject(assignmentExpression).left).property).name;
  var classProto = builders.memberExpression(builders.identifier(className), builders.identifier('prototype'), false);
  var classMethod = builders.memberExpression(classProto, builders.identifier(methodName), false);
  assignmentExpression.left = classMethod;
}
function createConstructorFunctionDeclaration(expressionStatement, className) {
  var functionExpression = $traceurRuntime.assertObject($traceurRuntime.assertObject(expressionStatement).expression).right;
  var classConstructorDeclaration = builders.functionDeclaration(builders.identifier(className), functionExpression.params, functionExpression.body);
  return classConstructorDeclaration;
}
function flattenCallExpressionArguments(callArguments, fullyQualifiedName, className) {
  callArguments.forEach((function(argumentNode, argumentIndex) {
    if (isNamespacedExpression(argumentNode, fullyQualifiedName)) {
      callArguments[argumentIndex] = builders.identifier(className);
    }
  }));
}
