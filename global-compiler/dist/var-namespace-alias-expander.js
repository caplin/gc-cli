import { shim } from 'array-includes';
import { types, visit } from 'recast';

import { getNamespacePath, isNamespaceAlias } from './utils/utilities';

const { namedTypes: { MemberExpression, VariableDeclarator } } = types;

shim();

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

		removeNamespaceAliases(this._namespaceAliasBindingsToRemove);
	}
};

/**
 * Checks if the provided identifier could be bound to a namespace alias.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @returns {boolean} true if it's possible for the identifier to be bound to an alias.
 */
function couldIdentifierBeBoundToANamespaceAlias(identifierNodePath) {
	const parentNodePath = identifierNodePath.parent;

	// If the identifier is part of a member expression `my.identifier` then it's not bound to a namespace alias.
	// That is unless it's part of a computed member expression i.e. `my[identifier]` in which case it is.
	if (MemberExpression.check(parentNodePath.node) && parentNodePath.get('property') === identifierNodePath && parentNodePath.node.computed === false) {
		return false;
	} else if (VariableDeclarator.check(parentNodePath.node)) {
		return false;
	}

	return true;
}

/**
 * If the provided identifier is bound to a namespace alias then expand it out to the namespace.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @param {Set<NodePath>} namespaceAliasBindingsToRemove - Set containing namespace alias bindings to
 *                                                       remove on completion.
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
	const identifierName = identifierNodePath.node.name;
	const identifierScope = identifierNodePath.scope.lookup(identifierName);

	if (identifierScope) {
		const identifierBindings = identifierScope.getBindings()[identifierName].slice();

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
		const identifierBinding = identifierBindings[0];

		if (VariableDeclarator.check(identifierBinding.parent.node)) {
			const varNameNodePath = identifierBinding.parent.get('id');
			const varValueNodePath = identifierBinding.parent.get('init');

			if (isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots)) {
				return varValueNodePath;
			}
		}
	}
}

/**
 * Once namespace aliases have been expanded to a namespace we can remove the alias bindings.
 *
 * @param {Set<NodePath>} namespaceAliasBindingsToRemove - Set containing namespace alias bindings to
 *                                                       remove on completion.
 */
function removeNamespaceAliases(namespaceAliasBindingsToRemove) {
	for (let namespaceAlias of namespaceAliasBindingsToRemove) {
		const parent = namespaceAlias.parent;
		const aliasName = namespaceAlias.get('id', 'name').value;
		const namespace = getNamespacePath(namespaceAlias.get('init').node, []).reverse().join('.');

		namespaceAlias.replace();

		if (parent.get('declarations').value.length === 0) {
			parent.replace();
		}

		// eslint-disable-next-line
		console.log('References to', aliasName, 'have been expanded to', namespace);
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
	const assignmentVisitor = {
		visitAssignmentExpression(assignmentExpressionNodePath) {
			const leftSide = assignmentExpressionNodePath.value.left;

			if (leftSide.name === identifierName && !identifierBindings.includes(leftSide)) {
				identifierBindings.push(leftSide);
			}

			this.traverse(assignmentExpressionNodePath);
		}
	};

	visit(identifierScopeNodePath, assignmentVisitor);
}