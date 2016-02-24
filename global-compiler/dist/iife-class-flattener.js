"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var List = require("immutable").List;

var _utilsUtilities = require("./utils/utilities");

var copyComments = _utilsUtilities.copyComments;
var isNamespacedExpressionNode = _utilsUtilities.isNamespacedExpressionNode;
var _types$namedTypes = types.namedTypes;
var Program = _types$namedTypes.Program;
var CallExpression = _types$namedTypes.CallExpression;
var ReturnStatement = _types$namedTypes.ReturnStatement;
var AssignmentExpression = _types$namedTypes.AssignmentExpression;

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
var iifeClassFlattenerVisitor = {
	/**
  * @param {string} fullyQualifiedName The fully qualified class name
  */
	initialize: function initialize(fullyQualifiedName) {
		var nameParts = fullyQualifiedName.split(".").reverse();

		this._namespaceList = List.of.apply(List, _toConsumableArray(nameParts));
		this._className = this._namespaceList.first();
	},

	/**
  * @param {NodePath} identifierNodePath Identifier NodePath
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		// Is this identifier the class name node `MyClass` of a fully namespaced expression `my.name.MyClass`
		var isNamespacedExpression = isNamespacedExpressionNode(parent.node, this._namespaceList);

		if (isNamespacedExpression && isRootPartOfIIFE(parent, identifierNodePath)) {
			replaceIIFEWithItsContents(parent.parent, this._className);
		}

		this.traverse(identifierNodePath);
	}
};

exports.iifeClassFlattenerVisitor = iifeClassFlattenerVisitor;
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
 * @param {NodePath} assignmentNodePath Assignment node path containing IIFE
 * @param {string}   className          The class name
 */
function replaceIIFEWithItsContents(assignmentNodePath, className) {
	var _assignmentNodePath$parent;

	var iifeBody = assignmentNodePath.get("right", "callee", "body", "body");
	// Filter out the final return statement in the IIFE as IIFE is being removed
	var iifeStatementsWithoutFinalReturn = iifeBody.value.filter(function (iifeStatement) {
		return !(ReturnStatement.check(iifeStatement) === true && iifeStatement.argument.name === className);
	});

	copyComments(assignmentNodePath.parent.node, iifeBody.value[0]);
	(_assignmentNodePath$parent = assignmentNodePath.parent).replace.apply(_assignmentNodePath$parent, _toConsumableArray(iifeStatementsWithoutFinalReturn));
}