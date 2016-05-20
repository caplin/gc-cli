"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var createRequireDeclaration = require("./utils/utilities").createRequireDeclaration;

var fixturesCalls = new Set();
var identifier = types.builders.identifier;
var _types$namedTypes = types.namedTypes;
var Literal = _types$namedTypes.Literal;
var Identifier = _types$namedTypes.Identifier;

/**
 * Finds any `fixtures` calls and adds `require` statements for them.
 */
var requireFixturesVisitor = {

	/**
  * @param {NodePath} callExpressionNodePath - VariableDeclaration NodePath.
  */
	visitCallExpression: function visitCallExpression(callExpressionNodePath) {
		storeFixturesCalls(callExpressionNodePath);

		this.traverse(callExpressionNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		var programStatements = programNodePath.get("body").value;

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = fixturesCalls[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var fixturesCall = _step.value;

				var fixture = fixturesCall.node.arguments[0].value;
				var moduleSource = fixture.replace(/\./g, "/");
				var moduleIdentifier = identifier(fixture.split(".").pop());
				var importDeclaration = createRequireDeclaration(moduleIdentifier, moduleSource);

				// Replace the call string value with the required module identifier.
				fixturesCall.node.arguments[0] = moduleIdentifier;
				programStatements.unshift(importDeclaration);
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator["return"]) {
					_iterator["return"]();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		fixturesCalls.clear();
	}
};

exports.requireFixturesVisitor = requireFixturesVisitor;
function storeFixturesCalls(callExpressionNodePath) {
	var callArgs = callExpressionNodePath.node.arguments;
	var callArg = callArgs[0];
	var argsAreOK = callArgs.length === 1 && Literal.check(callArg) && typeof callArg.value === "string";
	var calleeNode = callExpressionNodePath.node.callee;
	var isFixturesCall = Identifier.check(calleeNode) && calleeNode.name === "fixtures";

	if (isFixturesCall && argsAreOK) {
		fixturesCalls.add(callExpressionNodePath);
	}
}