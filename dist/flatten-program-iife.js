"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

var namedTypes = require("recast").types.namedTypes;

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
 * Removes all IIFEs at the Program level.
 * They will have their function lexical scope contents moved to the top module level.
 */
var flattenProgramIIFEVisitor = exports.flattenProgramIIFEVisitor = {
  /**
   * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
   */
  visitCallExpression: function visitCallExpression(callExpressionNodePath) {
    var callee = callExpressionNodePath.get("callee");
    var grandParent = callExpressionNodePath.parent.parent;

    var isGrandParentProgram = namedTypes.Program.check(grandParent.node);
    var isCalleeFunctionExpression = namedTypes.FunctionExpression.check(callee.node);

    if (isGrandParentProgram && isCalleeFunctionExpression) {
      var _callExpressionNodePath$parent;

      var iifeBody = callee.get("body", "body").value;

      (_callExpressionNodePath$parent = callExpressionNodePath.parent).replace.apply(_callExpressionNodePath$parent, _toConsumableArray(iifeBody));
    }

    this.traverse(callExpressionNodePath);
  }
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
