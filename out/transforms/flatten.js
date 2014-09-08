"use strict";
Object.defineProperties(exports, {
  namespacedClassVisitor: {get: function() {
      return namespacedClassVisitor;
    }},
  __esModule: {value: true}
});
var Sequence = require('immutable').Sequence;
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;
var namespacedClassVisitor = {
  initialize: function(fullyQualifiedName) {
    this._namespaceSequence = Sequence(fullyQualifiedName.split('.').reverse());
    this._className = this._namespaceSequence.first();
  },
  visitIdentifier: function(identifierNodePath) {
    var parent = identifierNodePath.parent;
    if (isNamespacedClassExpressionNode(parent.node, this._namespaceSequence)) {
      replaceNamespacedClassWithIdentifier(parent, identifierNodePath.node, this._className);
    }
    this.traverse(identifierNodePath);
  }
};
function isNamespacedClassExpressionNode(expressionNode, namespaceSequence) {
  if (namedTypes.Identifier.check(expressionNode)) {
    return expressionNode.name === namespaceSequence.first() && namespaceSequence.count() === 1;
  } else if (namedTypes.MemberExpression.check(expressionNode)) {
    var shortenedSequence = Sequence(namespaceSequence.skip(1).toArray());
    return namedTypes.Identifier.check(expressionNode.property) && expressionNode.property.name === namespaceSequence.first() && isNamespacedClassExpressionNode(expressionNode.object, shortenedSequence);
  }
  return false;
}
function replaceNamespacedClassWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
  var grandParent = namespacedClassNodePath.parent;
  if (namedTypes.CallExpression.check(grandParent.node)) {
    grandParent.get('arguments', namespacedClassNodePath.name).replace(classNameIdentifierNode);
  } else if (namedTypes.AssignmentExpression.check(grandParent.node)) {
    var constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, className);
    grandParent.parent.replace(constructorFunctionDeclaration);
  } else if (namedTypes.MemberExpression.check(grandParent.node)) {
    grandParent.get('object').replace(classNameIdentifierNode);
  } else {
    console.log('Namespaced class expression not transformed, grandparent node type ::', grandParent.node.type);
  }
}
function createConstructorFunctionDeclaration(assignmentExpression, className) {
  var functionExpression = assignmentExpression.right;
  var classConstructorDeclaration = builders.functionDeclaration(builders.identifier(className), functionExpression.params, functionExpression.body);
  return classConstructorDeclaration;
}
