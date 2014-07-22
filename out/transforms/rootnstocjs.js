"use strict";
Object.defineProperties(exports, {
  RootNamespaceVisitor: {get: function() {
      return RootNamespaceVisitor;
    }},
  __esModule: {value: true}
});
var Visitor = require('recast').Visitor;
var builders = require('ast-types').builders;
var RootNamespaceVisitor = function RootNamespaceVisitor(rootNamespace) {
  this._rootNamespace = rootNamespace;
};
($traceurRuntime.createClass)(RootNamespaceVisitor, {visitNewExpression: function(newExpression) {
    setNewExpressionIdentifier(newExpression);
    this.genericVisit(newExpression);
  }}, {}, Visitor);
function setNewExpressionIdentifier(newExpression) {
  var identifierName = $traceurRuntime.assertObject($traceurRuntime.assertObject($traceurRuntime.assertObject(newExpression).callee).property).name;
  newExpression.callee = builders.identifier(identifierName);
}
