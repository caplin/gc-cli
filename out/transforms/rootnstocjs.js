"use strict";
Object.defineProperties(exports, {
  rootNamespaceVisitor: {get: function() {
      return rootNamespaceVisitor;
    }},
  __esModule: {value: true}
});
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;
var PathVisitor = require('ast-types').PathVisitor;
var rootNamespaceVisitor = {
  initialize: function(rootNamespace, programStatements) {
    this._requiresToInsert = new Map();
    this._rootNamespace = rootNamespace;
    this._programStatements = programStatements;
  },
  visitNewExpression: function(newExpressionNodePath) {
    var newExpression = newExpressionNodePath.node;
    var expressionNamespace = getExpressionNamespace(newExpression.callee);
    if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
      var requireIdentifier = newExpression.callee.property.name;
      var importDeclaration = createRequireDeclaration(requireIdentifier, expressionNamespace);
      newExpression.callee = builders.identifier(requireIdentifier);
      this._requiresToInsert.set(expressionNamespace, importDeclaration);
    }
    this.traverse(newExpressionNodePath);
  },
  visitCallExpression: function(callExpressionNodePath) {
    var callExpression = callExpressionNodePath.node;
    flattenCallExpressionArguments(callExpression.arguments, this._rootNamespace, this._requiresToInsert);
    this.traverse(callExpressionNodePath);
  },
  visitProgram: function(programNodePath) {
    this.traverse(programNodePath);
    insertRequires(this._requiresToInsert, this._programStatements);
  }
};
function getExpressionNamespace(memberExpression) {
  if (namedTypes.Identifier.check(memberExpression)) {
    return memberExpression.name;
  } else if (namedTypes.MemberExpression.check(memberExpression)) {
    return getExpressionNamespace(memberExpression.object) + '.' + memberExpression.property.name;
  }
}
function createRequireDeclaration(requireIdentifier, importedModule) {
  var requireCall = builders.callExpression(builders.identifier('require'), [builders.literal(importedModule)]);
  var importDeclaration = builders.variableDeclaration('var', [builders.variableDeclarator(builders.identifier(requireIdentifier), requireCall)]);
  return importDeclaration;
}
function flattenCallExpressionArguments(callArguments, rootNamespace, requiresToInsert) {
  callArguments.forEach((function(argumentExpression, argumentIndex) {
    var expressionNamespace = getExpressionNamespace(argumentExpression);
    if (expressionNamespace.startsWith(rootNamespace + '.')) {
      var requireIdentifier = argumentExpression.property.name;
      var importDeclaration = createRequireDeclaration(requireIdentifier, expressionNamespace);
      callArguments[argumentIndex] = builders.identifier(requireIdentifier);
      requiresToInsert.set(expressionNamespace, importDeclaration);
    }
  }));
}
function insertRequires(requiresToInsert, programStatements) {
  requiresToInsert.forEach((function(importDeclaration) {
    programStatements.unshift(importDeclaration);
  }));
}
