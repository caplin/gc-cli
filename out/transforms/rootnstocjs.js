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
    setNewExpressionIdentifier(newExpression);
    this.genericVisit(newExpression);
  },
  insertRequires: function() {
    createRequireDeclaration(this._programStatements, 'Field', 'my.long.name.space.Field');
  }
}, {}, Visitor);
function setNewExpressionIdentifier(newExpression) {
  var identifierName = $traceurRuntime.assertObject($traceurRuntime.assertObject($traceurRuntime.assertObject(newExpression).callee).property).name;
  newExpression.callee = builders.identifier(identifierName);
}
function createRequireDeclaration(programStatements, requiredIdentifier, importedModule) {
  var requireCall = builders.callExpression(builders.identifier('require'), [builders.literal(importedModule)]);
  var importDeclaration = builders.variableDeclaration('var', [builders.variableDeclarator(builders.identifier(requiredIdentifier), requireCall)]);
  programStatements.unshift(importDeclaration);
}
