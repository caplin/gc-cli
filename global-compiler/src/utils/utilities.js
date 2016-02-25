import capitalize from 'capitalize';
import {types} from 'recast';

const {
	builders: {
		callExpression, identifier, literal, memberExpression, variableDeclaration, variableDeclarator
	},
	namedTypes: {Identifier, MemberExpression}
} = types;

/**
 * Returns true if the provided Expression node is a leaf node of a namespace.
 *
 * @param {AstNode} expressionNode - Expression AstNode.
 * @param {Iterable<string>} namespaceIterable - An Iterable of names to match the expressionNode to.
 * @returns {boolean} true if the node is a leaf namespace node.
 */
export function isNamespacedExpressionNode(expressionNode, namespaceIterable) {
	if (Identifier.check(expressionNode)) {
		return expressionNode.name === namespaceIterable.first() && namespaceIterable.count() === 1;
	} else if (MemberExpression.check(expressionNode)) {
		const isPropertyIdentifier = Identifier.check(expressionNode.property);
		const isIdentifierANamespaceLeaf = expressionNode.property.name === namespaceIterable.first();

		return isPropertyIdentifier && isIdentifierANamespaceLeaf &&
			isNamespacedExpressionNode(expressionNode.object, namespaceIterable.skip(1));
	}

	return false;
}

/**
 * Generates a variable name that does not clash with already existing variable names in the module.
 *
 * @param {string} varName - variable name seed to search for a variation.
 * @param {Set<string>} moduleIdentifiers - all variable names declared in the module.
 * @returns {string} a unique variable name for the module.
 */
export function calculateUniqueModuleVariableId(varName, moduleIdentifiers, namespaceParts = []) {
	let freeVarName = varName;
	let referencesWithSameName = 1;
	let namespacePartToPrepend = namespaceParts.length;

	while (moduleIdentifiers.has(freeVarName)) {
		if (namespacePartToPrepend > 0) {
			namespacePartToPrepend--;
			freeVarName = capitalize(namespaceParts[namespacePartToPrepend]) + varName;
		} else {
			freeVarName = varName + referencesWithSameName;
			referencesWithSameName++;
		}
	}

	return freeVarName;
}

/**
 * Creates a CJS require declaration e.g. 'var <modIden> = require("importedModule");'
 *
 * @param {AstNode} moduleIdentifier - The identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 * @param {importSpecifier} importSpecifier - The import specifier of the require.
 * @returns {ASTNode} require declaration.
 */
export function createRequireDeclaration(moduleIdentifier, importedModule, importSpecifier) {
	const importedModuleSource = literal(importedModule);
	const requireIdentifier = identifier('require');
	const requireCall = callExpression(requireIdentifier, [importedModuleSource]);

	if (importSpecifier) {
		const importSpecifierIdentifier = identifier(importSpecifier);
		const requireMemberExpression = memberExpression(requireCall, importSpecifierIdentifier, false);
		const requireVariableDeclarator = variableDeclarator(moduleIdentifier, requireMemberExpression);

		return variableDeclaration('var', [requireVariableDeclarator]);
	}

	if (moduleIdentifier) {
		const requireVariableDeclarator = variableDeclarator(moduleIdentifier, requireCall);

		return variableDeclaration('var', [requireVariableDeclarator]);
	}

	return requireCall;
}

/**
 * Given a namespaced expression AST node it will return the parts for that node.
 *
 * @param {AstNode} namespaceExpressionNode - AST node part of namespaced expression.
 * @param {string[]} namespaceParts - used to build up the labels that make up a fully qualified namespace.
 * @returns {string[]} the labels that make up a fully qualified namespace.
 */
export function getNamespacePath(namespaceExpressionNode, namespaceParts) {
	if (Identifier.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.name);
	} else if (MemberExpression.check(namespaceExpressionNode)) {
		namespaceParts.push(namespaceExpressionNode.property.name);
		return getNamespacePath(namespaceExpressionNode.object, namespaceParts);
	}

	return namespaceParts;
}

/**
 * Copy over comments ASTNode values from one node to another.
 *
 * @param  {ASTNode} bearerASTNode
 * @param  {ASTNode} receiverASTNode
 */
export function copyComments(bearerASTNode, receiverASTNode) {
	// If both the bearer AST node and the receiver AST node have comments prepend to the receiver.
	if (bearerASTNode.comments && receiverASTNode.comments) {
		receiverASTNode
			.comments
			.unshift(...bearerASTNode.comments);
	} else if (bearerASTNode.comments) {
		// If the bearer has comments and the receiver doesn't then we can just assign the comments.
		receiverASTNode.comments = bearerASTNode.comments;
	}
}

/**
 * Checks if expression is rooted by an identifier with a namespace root name.
 *
 * @param {NodePath} expressionNodePath - NodePath to check.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if provided expression is part of namespace.
 */
function isNamespacedExpression(expressionNodePath, namespaceRoots) {
	if (Identifier.check(expressionNodePath.node)) {
		return namespaceRoots.indexOf(expressionNodePath.node.name) > -1;
	} else if (MemberExpression.check(expressionNodePath.node)) {
		return isNamespacedExpression(expressionNodePath.get('object'), namespaceRoots);
	}

	return false;
}

/**
 * Checks if variable parts make up a namespace alias.
 *
 * @param {NodePath} varNameNodePath - a variable name NodePath.
 * @param {(NodePath|null)} varValueNodePath - a variable value NodePath.
 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
 * @returns {boolean} true if variable parts are a namespace alias.
 */
export function isNamespaceAlias(varNameNodePath, varValueNodePath, namespaceRoots) {
	const isVariableNameIdentifier = Identifier.check(varNameNodePath.node);
	const isVarValueNamespaced = varValueNodePath && isNamespacedExpression(varValueNodePath, namespaceRoots);

	return isVariableNameIdentifier && isVarValueNamespaced;
}
