"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var types = require("recast").types;

var Iterable = require("immutable").Iterable;

var isNamespacedExpressionNode = require("./utils/utilities").isNamespacedExpressionNode;

var _types$namedTypes = types.namedTypes;
var Program = _types$namedTypes.Program;
var CallExpression = _types$namedTypes.CallExpression;
var ReturnStatement = _types$namedTypes.ReturnStatement;
var AssignmentExpression = _types$namedTypes.AssignmentExpression;

/**
 * Convert an IIFEs if its result is bound to an identifier that matches the provided fully
 * qualified class name.
 * The IIFE contents will be moved to the module level.
 *
 * This transform works by identifying the class name in the IIFE class expression.
 *
 * my.name.space.MyClass = (function(){}());
 *
 * The transform is provided the name `my.name.space.MyClass` and when it finds a top level
 * assignment expression that matches an IIFE class structure it replaces it with the contents
 * of the IIFE.
 */
var iifeClassFlattenerVisitor = exports.iifeClassFlattenerVisitor = {
	/**
  * @param {string} fullyQualifiedName - The fully qualified class name.
  */
	initialize: function initialize(fullyQualifiedName) {
		var nameParts = fullyQualifiedName.split(".").reverse();

		this._namespaceIterable = Iterable(nameParts);
		this._className = this._namespaceIterable.first();
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		// Is this identifier the class name node `MyClass` of a fully namespaced expression `my.name.MyClass`
		var isNamespacedExpression = isNamespacedExpressionNode(parent.node, this._namespaceIterable);

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
	var grandparent = namespacedNodePath.parent;
	var assignmentExpressionGrandparent = grandparent.parent.parent;

	var namespacedNodeIsOnLeft = grandparent.get("left") === namespacedNodePath;
	var isRootOfIIFE = namespacedNodePath.get("property") === classNameNodePath;
	var callExpressionIsOnRight = CallExpression.check(grandparent.get("right").node);
	var namespacedNodeIsInAssignmentExpression = AssignmentExpression.check(grandparent.node);
	var assignmentGrandparentIsProgram = Program.check(assignmentExpressionGrandparent.node);

	return namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression && assignmentGrandparentIsProgram && callExpressionIsOnRight && isRootOfIIFE;
}

/**
 * @param {NodePath} assignmentNodePath - Assignment node path containing IIFE.
 * @param {string} className - The class name.
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	var _assignmentNodePath$parent;

	// Keep IIFE leading comments
	var comments = assignmentNodePath.parent.node.comments;
	var iifeBody = assignmentNodePath.get("right", "callee", "body", "body");
	// Filter out the final return statement in the IIFE as IIFE is being removed
	var iifeStatementsWithoutFinalReturn = iifeBody.value.filter(function (iifeStatement) {
		return !(ReturnStatement.check(iifeStatement) === true && iifeStatement.argument.name === className);
	});

	(_assignmentNodePath$parent = assignmentNodePath.parent).replace.apply(_assignmentNodePath$parent, _toConsumableArray(iifeStatementsWithoutFinalReturn));
	reattachCommentsFromIIFE(assignmentNodePath.parent.node, comments);
}

/**
 * When an IIFE is replaced with its contents the comments attached to it will be lost. We reattach them to the AST by
 * adding them as part of the comments for the first statement in the IIFE.
 *
 * @param {ASTNode}    firstStatementInIIFE The first statement from the contents of the IIFE
 * @param {Comment[]?} commentsFromIIFE     Comments attached to the IIFE
 */
function reattachCommentsFromIIFE(firstStatementInIIFE, commentsFromIIFE) {
	var commentsFromFirstStatementInIIFE = firstStatementInIIFE.comments;

	// If both the first statement in the IIFE and the IIFE have comments add the IIFE comments to the first statement
	if (commentsFromIIFE && commentsFromFirstStatementInIIFE) {
		commentsFromFirstStatementInIIFE.unshift.apply(commentsFromFirstStatementInIIFE, _toConsumableArray(commentsFromIIFE));
	} else if (commentsFromIIFE) {
		// If the first statement has no comments and the IIFE does then we can just assign the IIFE comments
		firstStatementInIIFE.comments = commentsFromIIFE;
	}
}
Object.defineProperty(exports, "__esModule", {
	value: true
});