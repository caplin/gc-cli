"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var _require = require("immutable");

var Iterable = _require.Iterable;

var namedTypes = require("recast").types.namedTypes;

var isNamespacedExpressionNode = require("./utils/utilities").isNamespacedExpressionNode;

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
var namespacedIIFEClassVisitor = exports.namespacedIIFEClassVisitor = {
	/**
  * @param {string} fullyQualifiedName - The fully qualified class name.
  */
	initialize: function initialize(fullyQualifiedName) {
		this._namespaceIterable = Iterable(fullyQualifiedName.split(".").reverse());
		this._className = this._namespaceIterable.first();
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		if (isNamespacedExpressionNode(parent.node, this._namespaceIterable) && isRootPartOfIIFE(parent, identifierNodePath)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
};

/**
 * @param {NodePath} namespacedNodePath - Root of the fully qualified namespaced NodePath.
 */
function isRootPartOfIIFE(namespacedNodePath, identifierNodePath) {
	var grandparent = namespacedNodePath.parent;
	var assignmentExpressionGrandparent = grandparent.parent.parent;

	var namespacedNodeIsOnLeft = grandparent.get("left") === namespacedNodePath;
	var isRootOfIIFE = namespacedNodePath.get("property") === identifierNodePath;
	var callExpressionIsOnRight = namedTypes.CallExpression.check(grandparent.get("right").node);
	var namespacedNodeIsInAssignmentExpression = namedTypes.AssignmentExpression.check(grandparent.node);
	var assignmentGrandparentIsProgram = namedTypes.Program.check(assignmentExpressionGrandparent.node);

	if (namespacedNodeIsOnLeft && namespacedNodeIsInAssignmentExpression && assignmentGrandparentIsProgram && callExpressionIsOnRight && isRootOfIIFE) {
		return true;
	}

	return false;
}

/**
 * @param {NodePath} assignmentNodePath - Assignment node path containing IIFE.
 * @param {string} className - The class name.
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	var _assignmentNodePath$parent;

	var comments = assignmentNodePath.parent.node.comments;
	var iifeBody = assignmentNodePath.get("right", "callee", "body", "body");
	var iifeStatementsWithoutFinalReturn = iifeBody.value.filter(function (iifeStatement) {
		var isNotFinalReturnStatement = !(namedTypes.ReturnStatement.check(iifeStatement) === true && iifeStatement.argument.name === className);

		return isNotFinalReturnStatement;
	});

	(_assignmentNodePath$parent = assignmentNodePath.parent).replace.apply(_assignmentNodePath$parent, _toConsumableArray(iifeStatementsWithoutFinalReturn));
	assignmentNodePath.parent.node.comments = comments;
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
