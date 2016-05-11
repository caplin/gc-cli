"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var _utilsUtilities = require("./utils/utilities");

var createRequireDeclaration = _utilsUtilities.createRequireDeclaration;
var isNamespacedExpressionNode = _utilsUtilities.isNamespacedExpressionNode;
var Identifier = types.namedTypes.Identifier;

/**
 * Checks if the given Node Path is a require CallExpression.
 *
 * @param {NodePath} callExpression - CallExpression NodePath.
 * @returns {boolean} true if the call expression is a module require.
 */
function isRequire(callExpression) {
	var callee = callExpression.get("callee");
	var isRequireCall = callee.node.name === "require";
	var isStandaloneRequireCall = Identifier.check(callee.node);

	return isRequireCall && isStandaloneRequireCall;
}

/**
 * Checks if the given Node Path is a library include CallExpression.
 *
 * @param {NodePath} callExpression - CallExpression NodePath.
 * @param {Iterable<string>} libraryIncludeIterable - A Iterable of names that correspond to a library include.
 * @returns {boolean} true if the call expression is a library include.
 */
function isALibraryInclude(callExpression, libraryIncludeIterable) {
	var callee = callExpression.get("callee");

	return isNamespacedExpressionNode(callee.node, libraryIncludeIterable);
}

/**
 * Certain library systems have non standard ways of including dependencies.
 * This transform aims to identify and replace them with a standard `require`.
 * The only requires added will be ones that are present in the code and in the `moduleIDsToRequire` `Set`.
 */
var replaceLibraryIncludesWithRequiresVisitor = {

	/**
  * @param {Set<string>} moduleIDsToRequire - The module IDs to require if included by non standard means.
  * @param {Iterable<string>} libraryIncludeIterable - A Iterable of names that correspond to a library include.
  */
	initialize: function initialize(moduleIDsToRequire, libraryIncludeIterable) {
		this._libraryIncludesInModule = new Map();
		this._moduleIDsRequiredInModule = new Set();
		this._moduleIDsToRequire = [].concat(_toConsumableArray(moduleIDsToRequire)).map(function (moduleSource) {
			return moduleSource.toLowerCase();
		});
		this._libraryIncludeIterable = libraryIncludeIterable.reverse();
	},

	/**
  * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
  */
	visitCallExpression: function visitCallExpression(callExpressionNodePath) {
		if (isRequire(callExpressionNodePath)) {
			var requireArgument = callExpressionNodePath.get("arguments", 0, "value");

			// Normalize the module source, as `jquery` and `jQuery` load the same library in BRJS.
			this._moduleIDsRequiredInModule.add(requireArgument.value.toLowerCase());
		} else if (isALibraryInclude(callExpressionNodePath, this._libraryIncludeIterable)) {
			var requireArgument = callExpressionNodePath.get("arguments", 0, "value");

			// Normalize the module source, as `jquery` and `jQuery` load the same library in BRJS.
			this._libraryIncludesInModule.set(callExpressionNodePath, requireArgument.value.toLowerCase());
		}

		this.traverse(callExpressionNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = this._libraryIncludesInModule[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var _step$value = _slicedToArray(_step.value, 2);

				var callExpressionNodePath = _step$value[0];
				var libraryIncludeID = _step$value[1];

				if (this._moduleIDsRequiredInModule.has(libraryIncludeID)) {
					callExpressionNodePath.parent.replace();
				} else if (this._moduleIDsToRequire.includes(libraryIncludeID)) {
					var libraryRequire = createRequireDeclaration(undefined, libraryIncludeID);

					callExpressionNodePath.replace(libraryRequire);
					this._moduleIDsRequiredInModule.add(libraryIncludeID);
				} else {
					// eslint-disable-next-line
					console.log("*** Library include for " + libraryIncludeID + " has not been replaced with a require ***");
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
};
exports.replaceLibraryIncludesWithRequiresVisitor = replaceLibraryIncludesWithRequiresVisitor;