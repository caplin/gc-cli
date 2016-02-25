"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var _types$builders = types.builders;
var blockStatement = _types$builders.blockStatement;
var callExpression = _types$builders.callExpression;
var expressionStatement = _types$builders.expressionStatement;
var functionExpression = _types$builders.functionExpression;

/**
 * Wrap the module in an IIFE. Useful if you don't want script references leaking to the global.
 */
var wrapModuleInIIFEVisitor = {
	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		// Only wrap a module if it has code, else you could replace a commented out module with an IIFE.
		if (programNodePath.node.body.length > 0) {
			var moduleBlockStatement = blockStatement(programNodePath.node.body);
			var iife = functionExpression(null, [], moduleBlockStatement);
			var iifeExpressionStatement = expressionStatement(callExpression(iife, []));

			programNodePath.get("body").replace([iifeExpressionStatement]);
		}

		return false;
	}
};
exports.wrapModuleInIIFEVisitor = wrapModuleInIIFEVisitor;