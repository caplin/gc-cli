"use strict";
Object.defineProperties(exports, {
  NamespacedClassVisitor: {get: function() {
      return NamespacedClassVisitor;
    }},
  __esModule: {value: true}
});
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;
var PathVisitor = require('ast-types').PathVisitor;
var NamespacedClassVisitor = function NamespacedClassVisitor(fullyQualifiedName) {
  $traceurRuntime.superCall(this, $NamespacedClassVisitor.prototype, "constructor", []);
  this._fullyQualifiedName = fullyQualifiedName.split('.');
  this._namespaceLength = this._fullyQualifiedName.length - 1;
  this._className = this._fullyQualifiedName[this._namespaceLength];
};
var $NamespacedClassVisitor = NamespacedClassVisitor;
($traceurRuntime.createClass)(NamespacedClassVisitor, {visitIdentifier: function(identifierNodePath) {
    var parent = identifierNodePath.parent;
    var identifierNode = identifierNodePath.node;
    if (isNamespacedClassExpressionNode(parent.node, this._fullyQualifiedName, this._namespaceLength)) {
      var grandParent = parent.parent;
      if (namedTypes.CallExpression.check(grandParent.node)) {
        grandParent.get('arguments', parent.name).replace(identifierNode);
      } else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
        var constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, this._className);
        grandParent.parent.replace(constructorFunctionDeclaration);
      } else if (namedTypes.MemberExpression.check(grandParent.node)) {
        grandParent.get('object').replace(identifierNode);
      } else {
        console.log('Namespaced class expression not transformed, grandparent node type ::', grandParent.node.type);
      }
    }
    this.traverse(identifierNodePath);
  }}, {}, PathVisitor);
function isNamespacedClassExpressionNode(expressionNode, fullyQualifiedName, positionToCheck) {
  if (namedTypes.Identifier.check(expressionNode)) {
    return expressionNode.name === fullyQualifiedName[positionToCheck] && positionToCheck === 0;
  } else if (namedTypes.MemberExpression.check(expressionNode)) {
    return namedTypes.Identifier.check(expressionNode.property) && expressionNode.property.name === fullyQualifiedName[positionToCheck] && isNamespacedClassExpressionNode(expressionNode.object, fullyQualifiedName, positionToCheck - 1);
  }
  return false;
}
function createConstructorFunctionDeclaration(assignmentExpression, className) {
  var functionExpression = assignmentExpression.right;
  var classConstructorDeclaration = builders.functionDeclaration(builders.identifier(className), functionExpression.params, functionExpression.body);
  return classConstructorDeclaration;
}
