"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var log = require("winston").log;

var createRequireDeclaration = require("./utils/utilities").createRequireDeclaration;

var expressionStatement = types.builders.expressionStatement;

/**
 * Add requires for any aliases found in the module strings. The requires are in the
 * `require(alias!found-alias)` form.
 */
var addAliasesRequiresVisitor = {
	initialize: function initialize(availableAliases) {
		this._aliasesInModule = new Set();
		this._availableAliases = availableAliases;
	},

	/**
  * @param {NodePath} literalNodePath - Literal NodePath.
  */
	visitLiteral: function visitLiteral(literalNodePath) {
		var literalValue = literalNodePath.get("value").value;

		if (typeof literalValue === "string") {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._availableAliases[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var availableAlias = _step.value;

					if (literalValue.includes(availableAlias)) {
						this._aliasesInModule.add(availableAlias);
					}
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
		}

		this.traverse(literalNodePath);
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
			for (var _iterator = this._aliasesInModule[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var aliasInModule = _step.value;

				var moduleSource = "alias!" + aliasInModule;
				var requireCall = createRequireDeclaration(undefined, moduleSource);
				var requireExpressionStatement = expressionStatement(requireCall);

				log("Adding " + moduleSource + " require.");

				programStatements.unshift(requireExpressionStatement);
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
	}
};
exports.addAliasesRequiresVisitor = addAliasesRequiresVisitor;