const {namedTypes} = require('ast-types');
const {Literal, CallExpression, Identifier} = namedTypes;

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

	return (nodePath) => matchers.reduce(testNodePath, nodePath);
}

//	MATCHERS

/**
 * Creates a predicate function that checks if a NodePath is a Literal with the
 * provided value. Will return the NodePath's parent if it matches.
 *
 * @param   {string} value - Expected value of the literal.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function literal(value) {
	return ({node, parent}) => {
		if (Literal.check(node) && node.value === value) {
			return parent;
		}
	}
}

/**
 * Creates a predicate function that checks if a NodePath is an Identifier with the
 * provided name. Will return the NodePath's parent if it matches.
 *
 * @param   {string} name - Expected name of the identifier.
 * @returns {Function} Returns the NodePath parent if it fits search criteria.
 */
export function identifier(name) {
	return ({node, parent}) => {
		if (Identifier.check(node) && node.name === name) {
			return parent;
		}
	}
}

export function callExpression(callExpressionPattern) {
	return function(possibleCallExpressionNodePath) {
		if (CallExpression.check(possibleCallExpressionNodePath.node) &&
			callExpressionPattern.callee(possibleCallExpressionNodePath.get('callee'))) {
			return possibleCallExpressionNodePath.parent;
		}
	}
}
