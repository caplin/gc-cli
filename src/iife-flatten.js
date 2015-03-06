import {types} from 'recast';
import {Iterable} from 'immutable';

import {isNamespacedExpressionNode} from './utils/utilities';

const {
	namedTypes: {
		Program,
		CallExpression,
		ReturnStatement,
		AssignmentExpression
	}
} = types;

/**
 * Convert an IIFEs if its result is bound to an identifier that matches the provided fully
 * qualified class name.
 * They will have their IIFE contents moved to the module level.
 */
export const iifeClassFlattenerVisitor = {
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
		const {parent} = identifierNodePath;
		// Is this identifier the class name node `MyClass` of a fully namespaced expression `name.MyClass`
		const isNamespacedExpression = isNamespacedExpressionNode(parent.node, this._namespaceIterable);

		if (isNamespacedExpression && isRootPartOfIIFE(parent, identifierNodePath)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
}

/**
 * Verify that the namespaced NodePath is part of an IIFE which is located at the top level of the
 * script.
 *
 * @param   {NodePath} namespacedNodePath Root of the fully qualified namespaced NodePath
 * @param   {NodePath} classNameNodePath  Class name identifier
 * @returns {Boolean}  true if node is script level IIFE
 */
function isRootPartOfIIFE(namespacedNodePath, classNameNodePath) {
	const grandparent = namespacedNodePath.parent;
	const assignmentExpressionGrandparent = grandparent.parent.parent;

	const namespacedNodeIsOnLeft = (grandparent.get('left') === namespacedNodePath);
	const isRootOfIIFE = (namespacedNodePath.get('property') === classNameNodePath);
	const callExpressionIsOnRight = CallExpression.check(grandparent.get('right').node);
	const namespacedNodeIsInAssignmentExpression = AssignmentExpression.check(grandparent.node);
	const assignmentGrandparentIsProgram = Program.check(assignmentExpressionGrandparent.node);

	return namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression
		&& assignmentGrandparentIsProgram && callExpressionIsOnRight && isRootOfIIFE;
}

/**
 * @param {NodePath} assignmentNodePath - Assignment node path containing IIFE.
 * @param {string} className - The class name.
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	// Keep IIFE leading comments
	const comments = assignmentNodePath.parent.node.comments;
	const iifeBody = assignmentNodePath.get('right', 'callee', 'body', 'body');
	// Filter out the final return statement in the IIFE as IIFE is being removed
	const iifeStatementsWithoutFinalReturn = iifeBody.value.filter((iifeStatement) => {
		return !(ReturnStatement.check(iifeStatement) === true && iifeStatement.argument.name === className);
	});

	assignmentNodePath.parent.replace(...iifeStatementsWithoutFinalReturn);
	assignmentNodePath.parent.node.comments = comments;
}
