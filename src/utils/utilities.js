var Sequence = require('immutable').Sequence;
var namedTypes = require('ast-types').namedTypes;

/**
 * Returns true if the provided Expression node is the root of a hierarchy of nodes that match the namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Sequence} namespaceSequence - A sequence of names to match the expressionNode to.
 */
export function isNamespacedExpressionNode(expressionNode, namespaceSequence) {
	if (namedTypes.Identifier.check(expressionNode)) {
		return expressionNode.name === namespaceSequence.first() && namespaceSequence.count() === 1;
	} else if (namedTypes.MemberExpression.check(expressionNode)) {
		//TODO: This seems like a workaround for a bug in 'immutable', investigate and fix.
		var shortenedSequence = Sequence(namespaceSequence.skip(1).toArray());

		return namedTypes.Identifier.check(expressionNode.property)
			&& expressionNode.property.name === namespaceSequence.first()
			&& isNamespacedExpressionNode(expressionNode.object, shortenedSequence);
	}

	return false;
}
