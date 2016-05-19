const { namedTypes } = require('recast').types;

const NOOP = () => true;
const { AssignmentExpression, Literal, CallExpression, Identifier, VariableDeclarator, MemberExpression } = namedTypes;

/**
 * Creates a function that checks if a NodePath matches the provided matchers.
 * The node is first matched against the first matcher provided and then its parent is checked
 * against the next matcher and so on. If a node satisfies a matcher the matcher returns the node's
 * parent.
 *
 * @param   {...Function} matchers - Matchers that a node must satisfy to be classed as matching.
 * @returns {Function} Function that checks if provided NodePath satifies matchers.
 */
export function composeMatchers(...matchers) {
  const testNodePath = (nodePathToTest, matcher) => nodePathToTest && matcher(nodePathToTest);

  return nodePath => matchers.reduce(testNodePath, nodePath);
}

/**
 * Creates a function that checks if a NodePath matches any of the provided matchers.
 * If a node satisfies any of the matchers the node's parent is returned.
 *
 * @param   {...Function} matchers - Matchers that a node may be tested against.
 * @returns {Function}    Function that checks if provided NodePath satifies matchers.
 */
export function orMatchers(...matchers) {
  return nodePath => {
    const testNodePath = matcher => nodePath && matcher(nodePath);

    if (matchers.some(testNodePath)) {
      return nodePath.parent;
    }
  };
}

//	MATCHERS

/**
 * Creates a predicate function that checks if a NodePath is a Literal with the
 * provided value. Will return the NodePath's parent if it matches.
 *
 * @param   {string} value - Expected value of the literal.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function literalMatcher(value) {
  return ({ node, parent }) => {
    if (Literal.check(node) && node.value === value) {
      return parent;
    }
  };
}

/**
 * Creates a predicate function that checks if a NodePath is an Identifier with the
 * provided name. Will return the NodePath's parent if it matches.
 *
 * @param   {string} name - Expected name of the identifier.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function identifierMatcher(name) {
  return ({ node, parent }) => {
    if (Identifier.check(node) && node.name === name) {
      return parent;
    }
  };
}

/**
 * Creates a predicate function that checks if a NodePath is a CallExpression with the
 * provided callee. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} callExpressionPattern - Expected callee of the call expression.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function callExpressionMatcher({ callee } = { callee: NOOP }) {
  return nodePath => {
    const { node, parent } = nodePath;

    if (CallExpression.check(node) && callee(nodePath.get('callee'))) {
      return parent;
    }
  };
}

/**
 * Creates a predicate function that checks if a NodePath is a VariableDeclarator with the
 * provided id. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} variableDeclaratorPattern - Expected id of the variable declarator.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function variableDeclaratorMatcher({ id }) {
  return nodePath => {
    const { node, parent } = nodePath;

    if (VariableDeclarator.check(node) && id(nodePath.get('id'))) {
      return parent;
    }
  };
}

/**
 * Creates a predicate function that checks if a NodePath is a MemberExpression with the
 * provided property. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} memberExpressionPattern - Expected property of the member expression.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function memberExpressionMatcher({ property, object = NOOP }) {
  return nodePath => {
    const { node, parent } = nodePath;

    if (MemberExpression.check(node) && property(nodePath.get('property')) && object(nodePath.get('object'))) {
      return parent;
    }
  };
}

/**
 * Creates a predicate function that checks if a NodePath is an AssignmentExpression with the
 * provided property. Will return the NodePath's parent if it matches.
 *
 * @param   {Object} assignmentExpressionPattern - Expected properties of the assignment expression.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function assignmentExpressionMatcher({ right }) {
  return nodePath => {
    const { node, parent } = nodePath;

    if (AssignmentExpression.check(node) && right(nodePath.get('right'))) {
      return parent;
    }
  };
}