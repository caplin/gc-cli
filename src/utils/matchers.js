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
	return (possibleLiteralNodePath) => {
		if (Literal.check(possibleLiteralNodePath.node) && possibleLiteralNodePath.node.value === value) {
			return possibleLiteralNodePath.parent;
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
	return function(possibleIdentifierNodePath) {
		if (Identifier.check(possibleIdentifierNodePath.node) &&
			possibleIdentifierNodePath.node.name === name) {
			return possibleIdentifierNodePath.parent;
		}
	}
}
