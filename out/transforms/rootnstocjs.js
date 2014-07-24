"use strict";
Object.defineProperties(exports, {
  RootNamespaceVisitor: {get: function() {
      return RootNamespaceVisitor;
    }},
  __esModule: {value: true}
});
var Visitor = require('recast').Visitor;
var builders = require('ast-types').builders;
var RootNamespaceVisitor = function RootNamespaceVisitor(rootNamespace, programStatements) {
  this._requiresToInsert = new Map();
  this._rootNamespace = rootNamespace;
  this._programStatements = programStatements;
};
($traceurRuntime.createClass)(RootNamespaceVisitor, {
  visitNewExpression: function(newExpression) {
    if (newExpression.callee.type === 'MemberExpression') {
      var expressionNamespace = getExpressionNamespace(newExpression.callee.object);
      if (expressionNamespace.startsWith(this._rootNamespace + '.')) {
        var requireIdentifier = newExpression.callee.property.name;
        var importedModule = expressionNamespace + requireIdentifier;
        var importDeclaration = createRequireDeclaration(requireIdentifier, importedModule);
        setNewExpressionIdentifier(newExpression);
        this._requiresToInsert.set(importedModule, importDeclaration);
      }
    }
    this.genericVisit(newExpression);
  },
  insertRequires: function() {
    var $__2 = this;
    this._requiresToInsert.forEach((function(importDeclaration) {
      $__2._programStatements.unshift(importDeclaration);
    }));
  }
}, {}, Visitor);
function getExpressionNamespace(memberExpression) {
  if (memberExpression.type === 'Identifier') {
    return memberExpression.name + '.';
  }
  if (memberExpression.type === 'MemberExpression') {
    return getExpressionNamespace(memberExpression.object) + memberExpression.property.name + '.';
  }
}
function setNewExpressionIdentifier(newExpression) {
  var identifierName = $traceurRuntime.assertObject($traceurRuntime.assertObject($traceurRuntime.assertObject(newExpression).callee).property).name;
  newExpression.callee = builders.identifier(identifierName);
}
function createRequireDeclaration(requireIdentifier, importedModule) {
  var requireCall = builders.callExpression(builders.identifier('require'), [builders.literal(importedModule)]);
  var importDeclaration = builders.variableDeclaration('var', [builders.variableDeclarator(builders.identifier(requireIdentifier), requireCall)]);
  return importDeclaration;
}
