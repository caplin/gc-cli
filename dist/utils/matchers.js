"use strict";

/**
 * Creates a function that checks if a NodePath matches the provided matchers.
 * The node is first matched against the first matcher provided and then its parent is checked
 * against the next matcher and so on. If a node satisfies a matcher the matcher returns the node's
 * parent.
 *
 * @param   {...Function} matchers - Matchers that a node must satisfy to be classed as matching.
 * @returns {Function} Function that checks if provided NodePath satifies matchers.
 */
exports.composeMatchers = composeMatchers;

/**
 * Creates a function that checks if a NodePath matches any of the provided matchers.
 * If a node satisfies any of the matchers the node's parent is returned.
 *
 * @param   {...Function} matchers - Matchers that a node may be tested against.
 * @returns {Function}    Function that checks if provided NodePath satifies matchers.
 */
exports.orMatchers = orMatchers;

//	MATCHERS

/**
 * Creates a predicate function that checks if a NodePath is a Literal with the
 * provided value. Will return the NodePath's parent if it matches.
 *
 * @param   {string} value - Expected value of the literal.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
exports.literalMatcher = literalMatcher;

/**
 * Creates a predicate function that checks if a NodePath is an Identifier with the
 * provided name. Will return the NodePath's parent if it matches.
 *
 * @param   {string} name - Expected name of the identifier.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
exports.identifierMatcher = identifierMatcher;

/**
 * Creates a predicate function that checks if a NodePath is a CallExpression with the
 * provided callee. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} callExpressionPattern - Expected callee of the call expression.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
exports.callExpressionMatcher = callExpressionMatcher;

/**
 * Creates a predicate function that checks if a NodePath is a VariableDeclarator with the
 * provided id. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} variableDeclaratorPattern - Expected id of the variable declarator.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
exports.variableDeclaratorMatcher = variableDeclaratorMatcher;

/**
 * Creates a predicate function that checks if a NodePath is a MemberExpression with the
 * provided property. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} memberExpressionPattern - Expected property of the member expression.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
exports.memberExpressionMatcher = memberExpressionMatcher;

var namedTypes = require("recast").types.namedTypes;

var NOOP = function () {
  return true;
};
var Literal = namedTypes.Literal;
var CallExpression = namedTypes.CallExpression;
var Identifier = namedTypes.Identifier;
var VariableDeclarator = namedTypes.VariableDeclarator;
var MemberExpression = namedTypes.MemberExpression;

function composeMatchers() {
  for (var _len = arguments.length, matchers = Array(_len), _key = 0; _key < _len; _key++) {
    matchers[_key] = arguments[_key];
  }

  var testNodePath = function (nodePathToTest, matcher) {
    return nodePathToTest && matcher(nodePathToTest);
  };

  return function (nodePath) {
    return matchers.reduce(testNodePath, nodePath);
  };
}

function orMatchers() {
  for (var _len = arguments.length, matchers = Array(_len), _key = 0; _key < _len; _key++) {
    matchers[_key] = arguments[_key];
  }

  return function (nodePath) {
    var testNodePath = function (matcher) {
      return nodePath && matcher(nodePath);
    };

    if (matchers.some(testNodePath)) {
      return nodePath.parent;
    }
  };
}

function literalMatcher(value) {
  return function (_ref) {
    var node = _ref.node;
    var parent = _ref.parent;

    if (Literal.check(node) && node.value === value) {
      return parent;
    }
  };
}

function identifierMatcher(name) {
  return function (_ref) {
    var node = _ref.node;
    var parent = _ref.parent;

    if (Identifier.check(node) && node.name === name) {
      return parent;
    }
  };
}

function callExpressionMatcher() {
  var _ref = arguments[0] === undefined ? { callee: NOOP } : arguments[0];

  var callee = _ref.callee;

  return function (nodePath) {
    var node = nodePath.node;
    var parent = nodePath.parent;

    if (CallExpression.check(node) && callee(nodePath.get("callee"))) {
      return parent;
    }
  };
}

function variableDeclaratorMatcher(_ref) {
  var id = _ref.id;

  return function (nodePath) {
    var node = nodePath.node;
    var parent = nodePath.parent;

    if (VariableDeclarator.check(node) && id(nodePath.get("id"))) {
      return parent;
    }
  };
}

function memberExpressionMatcher(_ref) {
  var property = _ref.property;

  return function (nodePath) {
    var node = nodePath.node;
    var parent = nodePath.parent;

    if (MemberExpression.check(node) && property(nodePath.get("property"))) {
      return parent;
    }
  };
}

Object.defineProperty(exports, "__esModule", {
  value: true
});
