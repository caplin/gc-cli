const {namedTypes} = require('ast-types');

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
 * This transform will discover aliases to namespace paths and when these aliases are
 * detected in code will expand the alias identifier to the complete namespace path.
 */
export const namespaceAliasExpanderVisitor = {
	/**
	 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
	 */
	initialize(namespaceRoots) {
		this._excludedAliases = new Set();
		this._namespaceAliases = new Map();
		this._namespaceRoots = namespaceRoots;
		this._identifiersThatCouldBeExpanded = new Map();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		registerIdentifierIfPossibleNamespaceAlias(identifierNodePath, this._identifiersThatCouldBeExpanded);

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
	 */
	visitVariableDeclarator(variableDeclaratorNodePath) {
		const varNameNodePath = variableDeclaratorNodePath.get("id");
		const varValueNodePath = variableDeclaratorNodePath.get("init");

		registerNewNamespaceAliases(varNameNodePath, varValueNodePath, this);

		this.traverse(variableDeclaratorNodePath);
	},

	/**
	 * @param {NodePath} assignmentExpressionNodePath - AssignmentExpression NodePath.
	 */
	visitAssignmentExpression(assignmentExpressionNodePath) {
		const varNameNodePath = assignmentExpressionNodePath.get("left");
		const varValueNodePath = assignmentExpressionNodePath.get("right");

		registerNewNamespaceAliases(varNameNodePath, varValueNodePath, this);

		this.traverse(assignmentExpressionNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		expandNamespaceAliases(this._namespaceAliases, this._excludedAliases, this._identifiersThatCouldBeExpanded);
	}
}

/**
 * If the provided identifier is the root of a member expression it could be a namespace alias.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @param {Set<NodePath>} identifiersThatCouldBeExpanded - Set of identifiers.
 */
function registerIdentifierIfPossibleNamespaceAlias(identifierNodePath, identifiersThatCouldBeExpanded) {
	const parentNodePath = identifierNodePath.parent;

	if (namedTypes.MemberExpression.check(parentNodePath.node)) {
		if (parentNodePath.get('object') === identifierNodePath) {
			registerIdentifier(identifierNodePath, identifiersThatCouldBeExpanded);
		}
	} else if (namedTypes.VariableDeclarator.check(parentNodePath.node) === false) {
		registerIdentifier(identifierNodePath, identifiersThatCouldBeExpanded);
	}
}

/**
 * Record the provided identifier for future comparison against the namespace aliases.
 *
 * @param {NodePath} identifierNodePath - Identifier NodePath.
 * @param {Set<NodePath>} identifiersThatCouldBeExpanded - Set of identifiers.
 */
function registerIdentifier(identifierNodePath, identifiersThatCouldBeExpanded) {
	const identifierName = identifierNodePath.node.name;
	const identifiers = identifiersThatCouldBeExpanded.get(identifierName) || [];

	identifiers.push(identifierNodePath);
	identifiersThatCouldBeExpanded.set(identifierName, identifiers);
}

/**
 * Registers a namespace alias if its alias name has never been detected before.
 * If the name has been detected before then it will be added to a set of identifiers
 * not to expand as it's likely it's being set in multiple places controlled by some conditional logic.
 *
 * @param {NodePath} varNameNodePath - a variable name NodePath.
 * @param {(NodePath|null)} varValueNodePath - a variable value NodePath.
 * @param {Object} namespaceAliasExpanderVisitor - The AST visitor.
 */
function registerNewNamespaceAliases(varNameNodePath, varValueNodePath, namespaceAliasExpanderVisitor) {
	const {_namespaceRoots, _namespaceAliases, _excludedAliases} = namespaceAliasExpanderVisitor;
	const isAlias = isNamespaceAlias(varNameNodePath, varValueNodePath, _namespaceRoots);

	if (isAlias && _namespaceAliases.has(varNameNodePath.node.name) === false) {
		_namespaceAliases.set(varNameNodePath.node.name, varValueNodePath);
	} else if (isAlias) {
		console.log('The alias', varNameNodePath.node.name, 'will not be expanded, it is set multiple times.');

		_excludedAliases.add(varNameNodePath.node.name);
	}
}

/**
 * Checks if variable parts are a namespace alias.
 *
 * @param {NodePath} varNameNodePath - a variable name NodePath.
 * @param {(NodePath|null)} varValueNodePath - a variable value NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if variable parts are a namespace alias.
 */
function isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots) {
	const isVariableNameIdentifier = namedTypes.Identifier.check(varNameNodePath.node);
	const isVarValueNamespaced = varValueNodePath && isNamespacedExpression(varValueNodePath, namespaceRoots);

	return isVariableNameIdentifier && isVarValueNamespaced;
}

/**
 * Checks if expression is a leaf of a namespaced expression.
 *
 * @param {NodePath} expressionNodePath - NodePath to check.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if provided expression is part of namespace.
 */
function isNamespacedExpression(expressionNodePath, namespaceRoots) {
	if (namedTypes.Identifier.check(expressionNodePath.node)) {
		return namespaceRoots.indexOf(expressionNodePath.node.name) > -1;
	} else if (namedTypes.MemberExpression.check(expressionNodePath.node)) {
		return isNamespacedExpression(expressionNodePath.get('object'), namespaceRoots);
	}

	return false;
}

/**
 * Expand any namespace alias using identifiers to a complete namespace member expression.
 *
 * @param {Map<string, NodePath>} namespaceAliases - All discovered namespace aliases.
 * @param {Set<string>} excludedAliases - Aliases set more then once and hence not safe to expand.
 * @param {Map<string, NodePath[]>} identifiersThatCouldBeExpanded - All identifiers that could use namespace aliases.
 */
function expandNamespaceAliases(namespaceAliases, excludedAliases, identifiersThatCouldBeExpanded) {
	for (let [alias, namespaceExpression] of namespaceAliases) {
		if (excludedAliases.has(alias) === false) {
			const aliasIdentifiers = identifiersThatCouldBeExpanded.get(alias) || [];
			const namespace = getNamespacePath(namespaceExpression.node, []).reverse().join('.');

			for (let identifier of aliasIdentifiers) {
				identifier.replace(namespaceExpression.node);
			}

			removeNamespaceAlias(namespaceExpression);

			console.log(aliasIdentifiers.length, 'References to', alias, 'have been expanded to', namespace);
		}
	}
}

/**
 * Given a namespaced expression AST node it will return the parts for that node.
 *
 * @param {AstNode} namespaceExpressionNode - AST node part of namespaced expression.
 * @param {string[]} namespaceParts - used to build up the labels that make up a fully qualified namespace.
 * @returns {string[]} the labels that make up a fully qualified namespace.
 */
function getNamespacePath(namespaceExpressionNode, namespaceParts) {
	if (namedTypes.Identifier.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.name);
	} else if (namedTypes.MemberExpression.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.property.name);
		return getNamespacePath(namespaceExpressionNode.object, namespaceParts);
	}

	return namespaceParts;
}

/**
 * Remove the namespace alias and clean up any left over nodes.
 *
 * @param {NodePath} namespaceExpression - A namespaced expression.
 */
function removeNamespaceAlias(namespaceExpression) {
	const grandParent = namespaceExpression.parent.parent;

	namespaceExpression.parent.replace();

	//TODO: this cleaning up should really be handled by ast-types...
	if (namedTypes.VariableDeclaration.check(grandParent.node)) {
		if (grandParent.get('declarations').value.length === 0) {
			grandParent.replace();
		}
	} else if (namedTypes.ExpressionStatement.check(grandParent.node)) {
		if (grandParent.get('expression').value === undefined) {
			grandParent.replace();
		}
	}
}
