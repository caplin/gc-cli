"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var copyComments = require("./utils/utilities").copyComments;

var _types$namedTypes = types.namedTypes;
var Program = _types$namedTypes.Program;
var FunctionExpression = _types$namedTypes.FunctionExpression;

/**
 * Removes all IIFEs at the Program level.
 * They will have their function lexical scope contents moved to the top module level.
 */
var flattenProgramIIFEVisitor = {
	/**
  * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
  */
	visitCallExpression: function visitCallExpression(callExpressionNodePath) {
		var callee = callExpressionNodePath.get("callee");
		var grandParent = callExpressionNodePath.parent.parent;
		var isGrandParentProgram = Program.check(grandParent.node);
		var isCalleeFunctionExpression = FunctionExpression.check(callee.node);

		if (isGrandParentProgram && isCalleeFunctionExpression) {
			var _callExpressionNodePath$parent;

			var iifeBody = callee.get("body", "body").value;

			copyComments(callExpressionNodePath.parentPath.node, iifeBody[0]);
			(_callExpressionNodePath$parent = callExpressionNodePath.parent).replace.apply(_callExpressionNodePath$parent, _toConsumableArray(iifeBody));
		}

		this.traverse(callExpressionNodePath);
	}
};
exports.flattenProgramIIFEVisitor = flattenProgramIIFEVisitor;