"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var namedTypes = require("recast").types.namedTypes;

var _require = require("recast");

var visit = _require.visit;

var _require2 = require("array-includes");

var shim = _require2.shim;

var _utilsUtilities = require("./utils/utilities");

var getNamespacePath = _utilsUtilities.getNamespacePath;
var isNamespaceAlias = _utilsUtilities.isNamespaceAlias;

shim();

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
 * This transform will discover aliases to namespace paths, bound as vars, and when these aliases are
 * detected in the AST it will expand the alias identifier to the complete namespace path.
 */
var varNamespaceAliasExpanderVisitor = {
	/**
  * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
  */
	initialize: function initialize(namespaceRoots) {
		this._namespaceRoots = namespaceRoots;
		this._namespaceAliasBindingsToRemove = new Set();
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		if (couldIdentifierBeBoundToANamespaceAlias(identifierNodePath)) {
			expandIdentifierIfItsANamespaceAlias(identifierNodePath, this._namespaceRoots, this._namespaceAliasBindingsToRemove);
		}

		this.traverse(identifierNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		removeNamespaceAliases(this._namespaceAliasBindingsToRemove);
	}
};

exports.varNamespaceAliasExpanderVisitor = varNamespaceAliasExpanderVisitor;
/**
 * Checks if the provided identifier could be bound to a namespace alias.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @returns {boolean} true if it's possible for the identifier to be bound to an alias.
 */
function couldIdentifierBeBoundToANamespaceAlias(identifierNodePath) {
	var parentNodePath = identifierNodePath.parent;

	if (namedTypes.MemberExpression.check(parentNodePath.node) && parentNodePath.get("property") === identifierNodePath) {
		return false;
	} else if (namedTypes.VariableDeclarator.check(parentNodePath.node)) {
		return false;
	}

	return true;
}

/**
 * If the provided identifier is bound to a namespace alias then expand it out to the namespace.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @param {Set<NodePath>} namespaceAliasBindingsToRemove - Set containing namespace alias bindings to remove on completion.
 */
function expandIdentifierIfItsANamespaceAlias(identifierNodePath, namespaceRoots, namespaceAliasBindingsToRemove) {
	var identifierBindings = getIdentifierBindings(identifierNodePath);
	var namespaceAliasValue = getNamespaceAliasValue(identifierBindings, namespaceRoots);

	if (namespaceAliasValue) {
		identifierNodePath.replace(namespaceAliasValue.node);
		namespaceAliasBindingsToRemove.add(namespaceAliasValue.parent);
	}
}

/**
 * Given an identifier it finds the scope it's bound in, if it is, and returns an array of all its bindings.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @returns {NodePath[]} Array of all identifier's bindings in the scope it's bound in.
 */
function getIdentifierBindings(identifierNodePath) {
	var identifierName = identifierNodePath.node.name;
	var identifierScope = identifierNodePath.scope.lookup(identifierName);

	if (identifierScope) {
		var identifierBindings = identifierScope.getBindings()[identifierName].slice();

		addIdentifierAssignments(identifierBindings, identifierScope.path, identifierName);

		return identifierBindings;
	}

	return [];
}

/**
 * If the identifier binding is a namespace alias return the namespace value NodePath.
 * If there are multiple bindings then we will not attempt to expand the identifier.
 *
 * @param {NodePath[]} identifierBindings - Identifier bindings.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {(NodePath|undefined)} the namespace value NodePath or undefined if not using alias.
 */
function getNamespaceAliasValue(identifierBindings, namespaceRoots) {
	if (identifierBindings.length === 1) {
		var identifierBinding = identifierBindings[0];

		if (namedTypes.VariableDeclarator.check(identifierBinding.parent.node)) {
			var varNameNodePath = identifierBinding.parent.get("id");
			var varValueNodePath = identifierBinding.parent.get("init");

			if (isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots)) {
				return varValueNodePath;
			}
		}
	}
}

/**
 * Once namespace aliases have been expanded to a namespace we can remove the alias bindings.
 *
 * @param {Set<NodePath>} namespaceAliasBindingsToRemove - Set containing namespace alias bindings to remove on completion.
 */
function removeNamespaceAliases(namespaceAliasBindingsToRemove) {
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = namespaceAliasBindingsToRemove[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var namespaceAlias = _step.value;

			var _parent = namespaceAlias.parent;
			var aliasName = namespaceAlias.get("id", "name").value;
			var namespace = getNamespacePath(namespaceAlias.get("init").node, []).reverse().join(".");

			namespaceAlias.replace();

			if (_parent.get("declarations").value.length === 0) {
				_parent.replace();
			}

			console.log("References to", aliasName, "have been expanded to", namespace);
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

/**
 * Add any assignments to an identifier that occur within the subtree of its scope.
 * The identifier bindings aren't enough to perform a safe transformation. We need to also make sure
 * there are no assignments to the identifier following it being bound to the scope. So if any
 * assignments occur to the identifier in the scope subtree which are not the original binding we
 * add them to the `identifierBindings` array.
 *
 * @param {Array}    identifierBindings - Bindings for the identifier.
 * @param {NodePath} identifierScopeNodePath - Scope identifier is declared in.
 * @param {string} identifierName - Name of identifier.
 */
function addIdentifierAssignments(identifierBindings, identifierScopeNodePath, identifierName) {
	var assignmentVisitor = {
		visitAssignmentExpression: function visitAssignmentExpression(assignmentExpressionNodePath) {
			var leftSide = assignmentExpressionNodePath.value.left;

			if (leftSide.name === identifierName && !identifierBindings.includes(leftSide)) {
				identifierBindings.push(leftSide);
			}

			this.traverse(assignmentExpressionNodePath);
		}
	};

	visit(identifierScopeNodePath, assignmentVisitor);
}