"use strict";

var builders = require("recast").types.builders;

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
 */
var wrapModuleInIIFEVisitor = exports.wrapModuleInIIFEVisitor = {
  /**
   * @param {NodePath} programNodePath - Program NodePath.
   */
  visitProgram: function visitProgram(programNodePath) {
    var moduleBlockStatement = builders.blockStatement(programNodePath.node.body);
    var iife = builders.functionExpression(null, [], moduleBlockStatement);
    var iifeExpressionStatement = builders.expressionStatement(builders.callExpression(iife, []));

    programNodePath.get("body").replace([iifeExpressionStatement]);

    return false;
  }
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
