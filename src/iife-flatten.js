const {Iterable} = require('immutable');
const namedTypes = require('recast').types.namedTypes;

import {isNamespacedExpressionNode} from './utils/utilities';

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * AstTypes NodePath.
 *
 * @typedef {Object} NodePath
 * @property {AstNode} node - SpiderMonkey AST node.
 */

/**
 * Converts all IIFEs that match the provided fully qualified class name.
 * They will have their function lexical scope contents moved to the top module level.
 */
export const namespacedIIFEClassVisitor = {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	initialize(fullyQualifiedName) {
		this._namespaceIterable = Iterable(fullyQualifiedName.split('.').reverse());
		this._className = this._namespaceIterable.first();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		const parent = identifierNodePath.parent;

		if (isNamespacedExpressionNode(parent.node, this._namespaceIterable)
			&& isRootPartOfIIFE(parent, identifierNodePath)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * @param {NodePath} namespacedNodePath - Root of the fully qualified namespaced NodePath.
 */
function isRootPartOfIIFE(namespacedNodePath, identifierNodePath) {
	const grandparent = namespacedNodePath.parent;
	const assignmentExpressionGrandparent = grandparent.parent.parent;

	const namespacedNodeIsOnLeft = (grandparent.get('left') === namespacedNodePath);
	const isRootOfIIFE = (namespacedNodePath.get('property') === identifierNodePath);
	const callExpressionIsOnRight = namedTypes.CallExpression.check(grandparent.get('right').node);
	const namespacedNodeIsInAssignmentExpression = namedTypes.AssignmentExpression.check(grandparent.node);
	const assignmentGrandparentIsProgram = namedTypes.Program.check(assignmentExpressionGrandparent.node);

	if (namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression
		&& assignmentGrandparentIsProgram && callExpressionIsOnRight && isRootOfIIFE) {
		return true;
	}

	return false;
}

/**
 * @param {NodePath} assignmentNodePath - Assignment node path containing IIFE.
 * @param {string} className - The class name.
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	const comments = assignmentNodePath.parent.node.comments;
	const iifeBody = assignmentNodePath.get('right', 'callee', 'body', 'body');
	const iifeStatementsWithoutFinalReturn = iifeBody.value.filter((iifeStatement) => {
		const isNotFinalReturnStatement = !(namedTypes.ReturnStatement.check(iifeStatement) === true
										&& iifeStatement.argument.name === className);

		return isNotFinalReturnStatement;
	});

	assignmentNodePath.parent.replace(...iifeStatementsWithoutFinalReturn);
	assignmentNodePath.parent.node.comments = comments;
}
