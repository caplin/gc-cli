"use strict";

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
 * This visitor finds all NodePaths that match certain criteria.
 * It performs no mutations itself but will notify a listener for each matched NodePath.
 */
var nodePathLocatorVisitor = exports.nodePathLocatorVisitor = {
	/**
  * @param {Function} matchedNodesReceiver - Will receive a Map<string, NodePath[]> of matched NodePaths.
  * @param {Map<string, Function>} matchers - The matchers to test NodePaths against.
  */
	initialize: function initialize(matchedNodesReceiver, matchers) {
		this._matchers = matchers;
		this._matchedNodePaths = new Map();
		this._matchedNodesReceiver = matchedNodesReceiver;
	},

	/**
  * @param {NodePath} literalNodePath - Literal NodePath.
  */
	visitLiteral: function visitLiteral(literalNodePath) {
		this._testNodePath("Literal", literalNodePath);
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		this._testNodePath("Identifier", identifierNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		this._matchedNodesReceiver(this._matchedNodePaths);
	},

	/**
  * @param {string} nodeType - The type of the Node wrapped by the NodePath.
  * @param {NodePath} nodePath - NodePath to test for a match.
  */
	_testNodePath: function _testNodePath(nodeType, nodePath) {
		var matcher = this._matchers.get(nodeType);

		if (matcher && matcher(nodePath)) {
			addToValueArray(nodeType, nodePath, this._matchedNodePaths);
		}

		this.traverse(nodePath);
	}
};

/**
 * If the provided Map does not have a value array for the key create one. Add value to provided Map.
 *
 * @param {string} key - Type of NodePath to add to map.
 * @param {NodePath} value - NodePath to add to map.
 * @param {Map<string, NodePath[]>} matchedNodePaths - Map to store matched NodePaths.
 */
function addToValueArray(key, value, matchedNodePaths) {
	if (matchedNodePaths.has(key)) {
		matchedNodePaths.get(key).push(value);
	} else {
		matchedNodePaths.set(key, [value]);
	}
}
Object.defineProperty(exports, "__esModule", {
	value: true
});