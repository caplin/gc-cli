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
($traceurRuntime.createClass)(RootNamespaceVisitor, {visitNewExpression: function(node) {
    for (var args = [],
        $__3 = 1; $__3 < arguments.length; $__3++)
      args[$__3 - 1] = arguments[$__3];
    console.log('visit NewExpression', node, args);
    node.callee = builders.identifier('Field');
    this.genericVisit(node);
  }}, {}, Visitor);
function createIdentifier() {}
