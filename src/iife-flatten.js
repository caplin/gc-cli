var Sequence = require('immutable').Sequence;
var namedTypes = require('ast-types').namedTypes;

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
export var namespacedIIFEClassVisitor = {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	initialize(fullyQualifiedName) {
		this._namespaceSequence = Sequence(fullyQualifiedName.split('.').reverse());
		this._className = this._namespaceSequence.first();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		if (isNamespacedExpressionNode(parent.node, this._namespaceSequence) && ifPartOfIIFE(parent)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * @param {NodePath} namespacedNodePath - Root of the fully qualified namespaced NodePath.
 */
function ifPartOfIIFE(namespacedNodePath) {
	var grandparent = namespacedNodePath.parent;
	var assignmentExpressionGrandparent = grandparent.parent.parent;

	var namespacedNodeIsOnLeft = (grandparent.get('left') === namespacedNodePath);
	var callExpressionIsOnRight = namedTypes.CallExpression.check(grandparent.get('right').node);
	var namespacedNodeIsInAssignmentExpression = namedTypes.AssignmentExpression.check(grandparent.node);
	var assignmentGrandparentIsProgram = namedTypes.Program.check(assignmentExpressionGrandparent.node);

	if (namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression
		&& assignmentGrandparentIsProgram && callExpressionIsOnRight) {
		return true;
	}

	return false;
}

/**
 * @param {NodePath} assignmentNodePath - Assignment node path containing IIFE.
 * @param {string} className - The class name.
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	var iifeBody = assignmentNodePath.get('right', 'callee', 'body', 'body');
	var iifeStatementsWithoutFinalReturn = iifeBody.value.filter((iifeStatement) => {
		var isNotFinalReturnStatement = !(namedTypes.ReturnStatement.check(iifeStatement) === true
										&& iifeStatement.argument.name === className);

		return isNotFinalReturnStatement;
	});

	assignmentNodePath.parent.replace(...iifeStatementsWithoutFinalReturn);
}
