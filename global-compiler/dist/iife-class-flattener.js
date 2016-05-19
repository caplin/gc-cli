import { types } from 'recast';
import { List } from 'immutable';

import { copyComments, isNamespacedExpressionNode } from './utils/utilities';

const {
	namedTypes: {
		Program,
		CallExpression,
		ReturnStatement,
		AssignmentExpression
	}
} = types;

/**
 * Flattens an IIFEs if its result is bound to an expression that matches the fully qualified
 * class name. The IIFE contents will be moved to the module level.
 *
 * This transform works by identifying the class name in the IIFE class expression.
 *
 * my.name.space.MyClass = (function(){}());
 *
 * The transform is provided the name `my.name.space.MyClass` and when it finds a top level
 * assignment expression that matches an IIFE class structure it replaces it with the contents
 * of the IIFE.
 */
export const iifeClassFlattenerVisitor = {
	/**
  * @param {string} fullyQualifiedName The fully qualified class name
  */
	initialize(fullyQualifiedName) {
		const nameParts = fullyQualifiedName.split('.').reverse();

		this._namespaceList = List.of(...nameParts);
		this._className = this._namespaceList.first();
	},

	/**
  * @param {NodePath} identifierNodePath Identifier NodePath
  */
	visitIdentifier(identifierNodePath) {
		const { parent } = identifierNodePath;
		// Is this identifier the class name node `MyClass` of a fully namespaced expression `my.name.MyClass`
		const isNamespacedExpression = isNamespacedExpressionNode(parent.node, this._namespaceList);

		if (isNamespacedExpression && isRootPartOfIIFE(parent, identifierNodePath)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
};

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

	const namespacedNodeIsOnLeft = grandparent.get('left') === namespacedNodePath;
	const isRootOfIIFE = namespacedNodePath.get('property') === classNameNodePath;
	const callExpressionIsOnRight = CallExpression.check(grandparent.get('right').node);
	const namespacedNodeIsInAssignmentExpression = AssignmentExpression.check(grandparent.node);
	const assignmentGrandparentIsProgram = Program.check(assignmentExpressionGrandparent.node);

	return namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression && assignmentGrandparentIsProgram && callExpressionIsOnRight && isRootOfIIFE;
}

/**
 * @param {NodePath} assignmentNodePath Assignment node path containing IIFE
 * @param {string}   className          The class name
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	const iifeBody = assignmentNodePath.get('right', 'callee', 'body', 'body');
	// Filter out the final return statement in the IIFE as IIFE is being removed
	const iifeStatementsWithoutFinalReturn = iifeBody.value.filter(iifeStatement => {
		return !(ReturnStatement.check(iifeStatement) === true && iifeStatement.argument.name === className);
	});

	copyComments(assignmentNodePath.parent.node, iifeBody.value[0]);
	assignmentNodePath.parent.replace(...iifeStatementsWithoutFinalReturn);
}