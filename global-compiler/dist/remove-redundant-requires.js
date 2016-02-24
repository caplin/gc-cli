"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var _types$namedTypes = types.namedTypes;
var Literal = _types$namedTypes.Literal;
var Identifier = _types$namedTypes.Identifier;
var ExpressionStatement = _types$namedTypes.ExpressionStatement;
var MemberExpression = _types$namedTypes.MemberExpression;
var VariableDeclarator = _types$namedTypes.VariableDeclarator;

/**
 * Removes redundant requires from modules, e.g. requires that don't bind a module variable if there is a
 * require for the same module that does bind one.
 */
var removeRedundantRequiresVisitor = {
	initialize: function initialize() {
		this._moduleRequires = new Map();
	},

	/**
  * @param {NodePath} callExpressionNodePath - VariableDeclaration NodePath.
  */
	visitCallExpression: function visitCallExpression(callExpressionNodePath) {
		storeRequireCalls(callExpressionNodePath, this._moduleRequires);

		this.traverse(callExpressionNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		sortRequiresAndPruneRedundantRequires(this._moduleRequires);
	}
};

exports.removeRedundantRequiresVisitor = removeRedundantRequiresVisitor;
/**
 * Checks if the given Node Path is a require statement.
 *
 * @param {NodePath} callExpressionNodePath - CallExpressionNodePath NodePath.
 * @returns {boolean}
 */
function isARequire(callExpressionNodePath) {
	var args = callExpressionNodePath.get("arguments").value;
	var argumentsAreOK = args.length === 1 && Literal.check(args[0]);
	var callee = callExpressionNodePath.get("callee");
	var calleeIsOK = callee.node.name === "require" && Identifier.check(callee.node);

	return argumentsAreOK && calleeIsOK;
}

/**
 * Gets a module's source
 *
 * @param  {NodePath} callExpressionNodePath
 * @return {string}
 */
function getModuleSource(callExpressionNodePath) {
	var args = callExpressionNodePath.get("arguments").value;

	return args[0].value;
}

/**
 * If the call expression is a `require` expression store the NodePath.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Map<string, Array<NodePath>>} moduleRequires
 */
function storeRequireCalls(callExpressionNodePath, moduleRequires) {
	if (isARequire(callExpressionNodePath)) {
		var moduleSource = getModuleSource(callExpressionNodePath);
		var moduleSourceRequires = moduleRequires.get(moduleSource) || [];

		moduleSourceRequires.push(callExpressionNodePath);
		moduleRequires.set(moduleSource, moduleSourceRequires);
	}
}

/**
 * Get a require call's import specifier (what the require imports).
 *
 * @param  {NodePath} requireCallExpressionNodePath
 * @return {string}
 */
function getImportSpecifier(requireCallExpressionNodePath) {
	var parentNode = requireCallExpressionNodePath.parentPath.node;

	if (ExpressionStatement.check(parentNode)) {
		// A stand alone require, default import e.g. `require('mylib')`.
		return "default";
	}

	if (MemberExpression.check(parentNode)) {
		// A named import e.g. `require('mylib').namedImport`.
		return parentNode.property.name;
	}

	if (VariableDeclarator.check(parentNode)) {
		// Default import that's bound to a variable e.g. `var lib = require('mylib')`.
		return "default";
	}
}

/**
 * Get a require call's local binding (what the required value is bound to in the module).
 *
 * @param  {NodePath} requireCallExpressionNodePath
 * @return {string}
 */
function getModuleLocalImportBinding(requireCallExpressionNodePath) {
	var parentNode = requireCallExpressionNodePath.parentPath.node;

	if (ExpressionStatement.check(parentNode)) {
		// A stand alone require with no local binding, default import e.g. `require('mylib')`.
		return "";
	}

	if (MemberExpression.check(parentNode)) {
		// A named import binding to a variable e.g. `var binding = require('mylib').namedImport`.
		return requireCallExpressionNodePath.parentPath.parentPath.node.id.name;
	}

	if (VariableDeclarator.check(parentNode)) {
		// Default import that's bound to a variable e.g. `var lib = require('mylib')`.
		return parentNode.id.name;
	}
}

/**
 * Given a map of all requires for a specific module source i.e. `mylib` in `var binding = require('mylib')` remove
 * any redundant requires, e.g. default unbound requires are pointless if there is another require for that module
 * source present. `require('mylib')` can be pruned if `var binding = require('mylib')` exists.
 *
 * @param  {Map<string, Array<NodePath>>} requireMetadataToRequireNodePaths
 */
function pruneRedundantRequires(requireMetadataToRequireNodePaths) {
	var moduleRequiresWithNoBindings = requireMetadataToRequireNodePaths.get("default");

	if (requireMetadataToRequireNodePaths.size > 1 && moduleRequiresWithNoBindings) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = moduleRequiresWithNoBindings[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var unboundRequire = _step.value;

				unboundRequire.prune();
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
}

/**
 * Given a require call calculate the require's metadata and store it keyed by its metadata.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Map<string, Array<NodePath>>} requireMetadataToRequireNodePaths
 */
function groupModuleSourceRequires(callExpressionNodePath, requireMetadataToRequireNodePaths) {
	var importSpecifier = getImportSpecifier(callExpressionNodePath);
	var moduleLocalImportBinding = getModuleLocalImportBinding(callExpressionNodePath);
	var requireMetadata = importSpecifier + moduleLocalImportBinding;
	var callExpressionsForSpecificRequire = requireMetadataToRequireNodePaths.get(requireMetadata) || [];

	callExpressionsForSpecificRequire.push(callExpressionNodePath);
	requireMetadataToRequireNodePaths.set(requireMetadata, callExpressionsForSpecificRequire);
}

/**
 * Sort a module source's requires and remove any redundant ones.
 *
 * @param  {Map<NodePath>} moduleRequires
 */
function sortRequiresAndPruneRedundantRequires(moduleRequires) {
	// For all the requires for a specific module source.
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = moduleRequires.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var callExpressionNodePaths = _step.value;

			var requireMetadataToRequireNodePaths = new Map();

			// Group the requires by their metadata.
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = callExpressionNodePaths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var callExpressionNodePath = _step2.value;

					groupModuleSourceRequires(callExpressionNodePath, requireMetadataToRequireNodePaths);
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
						_iterator2["return"]();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			// Remove any requires for a module source that are superfluous.
			pruneRedundantRequires(requireMetadataToRequireNodePaths);
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