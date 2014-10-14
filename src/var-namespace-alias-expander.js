const {namedTypes} = require('ast-types');

import {isNamespaceAlias} from './utils/utilities';

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
export const varNamespaceAliasExpanderVisitor = {
	/**
	 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
	 */
	initialize(namespaceRoots) {
		this._namespaceRoots = namespaceRoots;
		this._namespaceAliasBindingsToRemove = new Set();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		if (couldIdentifierBeBoundToANamespaceAlias(identifierNodePath)) {
			expandIdentifierIfItsANamespaceAlias(identifierNodePath, this._namespaceRoots, this._namespaceAliasBindingsToRemove);
		}

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		for (let namespaceAliasValue of this._namespaceAliasBindingsToRemove) {
			var parent = namespaceAliasValue.parent;
			namespaceAliasValue.replace();

			if (parent.get('declarations').value.length === 0) {
				parent.replace();
			}
		}
	}
}

/**
 * Checks if the provided identifier could be bound to a namespace alias.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @returns {boolean} true if it's possible for the identifier to be bound to an alias.
 */
function couldIdentifierBeBoundToANamespaceAlias(identifierNodePath) {
	const parentNodePath = identifierNodePath.parent;

	if (namedTypes.MemberExpression.check(parentNodePath.node) && parentNodePath.get('property') === identifierNodePath) {
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
	const identifierBindings = getIdentifierBindings(identifierNodePath);
	const namespaceAliasValue = getNamespaceAliasValue(identifierBindings, namespaceRoots);

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
		return identifierScope.getBindings()[identifierName];
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
			const varNameNodePath = identifierBinding.parent.get("id");
			const varValueNodePath = identifierBinding.parent.get("init");

			if (isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots)) {
				return varValueNodePath;
			}
		}
	}
}
