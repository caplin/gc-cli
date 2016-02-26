"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var Iterable = require("immutable").Iterable;

var types = require("recast").types;

var isNamespacedExpressionNode = require("./utils/utilities").isNamespacedExpressionNode;

var identifier = types.builders.identifier;

/**
 * Given member expression parts flatten all their occurences to the provided identifier.
 */
var flattenMemberExpression = {

	/**
  * @param {string[]} memberExpressionParts - The parts of the member expression to flatten.
  * @param {string} replacementIdentifier - The name of the identifier to replace the flattened member expression.
  */
	initialize: function initialize(memberExpressionParts, replacementIdentifier) {
		this._memberExpressionParts = Iterable(memberExpressionParts.reverse());
		this._replacementIdentifier = identifier(replacementIdentifier);
	},

	/**
  * @param {NodePath} memberExpressionNodePath - MemberExpression NodePath.
  */
	visitMemberExpression: function visitMemberExpression(memberExpressionNodePath) {
		if (isNamespacedExpressionNode(memberExpressionNodePath.node, this._memberExpressionParts)) {
			memberExpressionNodePath.replace(this._replacementIdentifier);
		}

		this.traverse(memberExpressionNodePath);
	}
};
exports.flattenMemberExpression = flattenMemberExpression;