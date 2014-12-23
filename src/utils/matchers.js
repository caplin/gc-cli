const {namedTypes} = require('ast-types');
const {Literal, CallExpression, Identifier} = namedTypes;

/**
 *
 */
export function composeMatchers(...matchers) {
	return (nodePath) => matchers.reduce(
			(nodePathToTest, matcher) => nodePathToTest && matcher(nodePathToTest), nodePath
	);
}

//	MATCHERS

/**
 *
 */
export function literal(value) {
	return ({node, parent}) => {
		if (Literal.check(node) && node.value === value) {
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

export function identifier(name) {
	return ({node, parent}) => {
		if (Identifier.check(node) && node.name === name) {
			return parent;
		}
	}
}
