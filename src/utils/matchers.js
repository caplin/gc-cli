const {namedTypes} = require('ast-types');

/**
 *
 */
export function composeMatchers(...matchers) {
	return function(nodePath) {
		return matchers.reduce((nodePathToTest, matcher) => nodePathToTest && matcher(nodePathToTest), nodePath);
	}
}

//	MATCHERS

/**
 *
 */
export function literal(value) {
	return function(possibleLiteralNodePath) {
		if (namedTypes.Literal.check(possibleLiteralNodePath.node) && possibleLiteralNodePath.node.value === value) {
			return possibleLiteralNodePath.parent;
		}
	}
}

//callExpression({'callee': identifier('require')})
export function callExpression(callExpressionPattern) {
	return function(possibleCallExpressionNodePath) {
		if (namedTypes.CallExpression.check(possibleCallExpressionNodePath.node) &&
			callExpressionPattern.callee(possibleCallExpressionNodePath.get('callee'))) {
			return possibleCallExpressionNodePath.parent;
		}
	}
}

export function identifier(name) {
	return function(possibleIdentifierNodePath) {
		if (namedTypes.Identifier.check(possibleIdentifierNodePath.node) && possibleIdentifierNodePath.node.name === name) {
			return possibleIdentifierNodePath.parent;
		}
	}
}
