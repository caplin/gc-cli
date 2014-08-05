"use strict";
Object.defineProperties(exports, {
  RootNamespaceVisitor: {get: function() {
      return RootNamespaceVisitor;
    }},
  __esModule: {value: true}
});
var $__0 = require('ast-types'),
    builders = $__0.builders,
    PathVisitor = $__0.PathVisitor;
var RootNamespaceVisitor = function RootNamespaceVisitor(rootNamespace, programStatements) {
  $traceurRuntime.superCall(this, $RootNamespaceVisitor.prototype, "constructor", []);
  this._requiresToInsert = new Map();
  this._rootNamespace = rootNamespace;
  this._programStatements = programStatements;
};
var $RootNamespaceVisitor = RootNamespaceVisitor;
($traceurRuntime.createClass)(RootNamespaceVisitor, {
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
  insertRequires: function() {
    var $__1 = this;
    this._requiresToInsert.forEach((function(importDeclaration) {
      $__1._programStatements.unshift(importDeclaration);
    }));
  }
}, {}, PathVisitor);
function getExpressionNamespace(memberExpression) {
  if (memberExpression.type === 'Identifier') {
    return memberExpression.name;
  } else if (memberExpression.type === 'MemberExpression') {
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
