"use strict";
Object.defineProperties(exports, {
  flattenNamespace: {get: function() {
      return flattenNamespace;
    }},
  NamespacedClassVisitor: {get: function() {
      return NamespacedClassVisitor;
    }},
  __esModule: {value: true}
});
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;
var PathVisitor = require('ast-types').PathVisitor;
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
  var expression = programStatement.expression;
  var className = fullyQualifiedName[fullyQualifiedName.length - 1];
  if (expression.type === 'AssignmentExpression') {
    return flattenAssignmentExpression(programStatement, fullyQualifiedName, className);
  } else if (expression.type === 'CallExpression') {
    flattenCallExpressionArguments(expression.arguments, fullyQualifiedName, className);
  }
  return programStatement;
}
function flattenAssignmentExpression(expressionStatement, fullyQualifiedName, className) {
  var assignmentExpression = expressionStatement.expression;
  var assignmentLeftExpression = assignmentExpression.left;
  if (isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName)) {
    flattenClassMethod(assignmentExpression, className);
  } else if (isNamespacedExpression(assignmentLeftExpression, fullyQualifiedName)) {
    return createConstructorFunctionDeclaration(expressionStatement, className);
  }
  return expressionStatement;
}
function isNamespacedMethod(assignmentLeftExpression, fullyQualifiedName) {
  var fullyQualifiedMethod = Array.from(fullyQualifiedName).concat('prototype', '*');
  return isNamespacedExpression(assignmentLeftExpression, fullyQualifiedMethod);
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
  var methodName = assignmentExpression.left.property.name;
  var classProto = builders.memberExpression(builders.identifier(className), builders.identifier('prototype'), false);
  var classMethod = builders.memberExpression(classProto, builders.identifier(methodName), false);
  assignmentExpression.left = classMethod;
}
function createConstructorFunctionDeclaration(expressionStatement, className) {
  var functionExpression = expressionStatement.expression.right;
  var classConstructorDeclaration = builders.functionDeclaration(builders.identifier(className), functionExpression.params, functionExpression.body);
  return classConstructorDeclaration;
}
function flattenCallExpressionArguments(callArguments, fullyQualifiedName, className) {
  callArguments.forEach((function(argumentExpression, argumentIndex) {
    if (isNamespacedExpression(argumentExpression, fullyQualifiedName)) {
      callArguments[argumentIndex] = builders.identifier(className);
    }
  }));
}
var NamespacedClassVisitor = function NamespacedClassVisitor(fullyQualifiedName) {
  $traceurRuntime.superCall(this, $NamespacedClassVisitor.prototype, "constructor", []);
  this._fullyQualifiedName = fullyQualifiedName.split('.');
  this._className = this._fullyQualifiedName[this._fullyQualifiedName.length - 1];
};
var $NamespacedClassVisitor = NamespacedClassVisitor;
($traceurRuntime.createClass)(NamespacedClassVisitor, {visitIdentifier: function(identifierNodePath) {
    var parent = identifierNodePath.parent;
    var identifierNode = identifierNodePath.node;
    if (identifierNode.name === this._className) {
      console.log(t(parent.node, this._fullyQualifiedName, this._fullyQualifiedName.length - 1));
      var grandParent = parent.parent;
      if (namedTypes.CallExpression.check(grandParent.node)) {
        grandParent.get('arguments', parent.name).replace(identifierNode);
      } else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
        grandParent.get(parent.name).replace(identifierNode);
      } else {
        identifierNodePath.parent.parent.get('object').replace(identifierNode);
      }
    }
    this.traverse(identifierNodePath);
  }}, {}, PathVisitor);
function t(expressionNode, fullyQualifiedName, positionToCheck) {
  if (namedTypes.Identifier.check(expressionNode)) {
    return expressionNode.name === fullyQualifiedName[positionToCheck] && positionToCheck === 0;
  } else if (namedTypes.MemberExpression.check(expressionNode)) {
    return namedTypes.Identifier.check(expressionNode.property) && expressionNode.property.name === fullyQualifiedName[positionToCheck] && t(expressionNode.object, fullyQualifiedName, positionToCheck - 1);
  }
  return false;
}
