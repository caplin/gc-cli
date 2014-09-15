var Sequence = require('immutable').Sequence;
var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;

import {isNamespacedExpressionNode} from './utils/utilities';

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
 * Converts all Expressions under the specified root namespaces.
 * They will be mutated to flat Identifiers along with newly inserted CJS require statements.
 */
export var rootNamespaceVisitor = {
	/**
	 * @param {String[]} rootNamespaces - The root namespaces.
	 * @param {AstNode[]} programStatements - Program body statements.
	 */
	initialize(rootNamespaces, programStatements) {
		this._requiresToInsert = new Map();
		this._rootNamespaces = rootNamespaces.map(rootNamespace => Sequence(rootNamespace));
		this._programStatements = programStatements;
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		this._rootNamespaces.forEach((rootNamespace) => {
			if (isNamespacedExpressionNode(identifierNodePath.node, rootNamespace)) {
				replaceNamespaceWithIdentifier(identifierNodePath, this._requiresToInsert);
			}
		});

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		insertRequires(this._requiresToInsert, this._programStatements);
	}
}

/**
 * Replaces namespaced nodes with an identifier and a require statement.
 *
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {Map} requiresToInsert - Map of requires to insert into program.
 */
function replaceNamespaceWithIdentifier(identifierNodePath, requiresToInsert) {
	var nodesPath = [identifierNodePath];
	var namespaceParts = [identifierNodePath.node.name];

	populateNamespacePath(nodesPath, namespaceParts);

	var parentNode = nodesPath[nodesPath.length - 1].node;

	if (namedTypes.NewExpression.check(parentNode)) {
		replaceNamespacedNodeWithIdentifierAndRequire(nodesPath, namespaceParts, requiresToInsert);
	} else if (namedTypes.CallExpression.check(parentNode)) {
		removeMethodCalls(nodesPath, namespaceParts);
		replaceNamespacedNodeWithIdentifierAndRequire(nodesPath, namespaceParts, requiresToInsert);
	}
}

/**
 * Fill provided arrays with nodes and the namespace parts that make up the namespace tree.
 *
 * @param {Array} nodesPath - Node paths that make up the namespace.
 * @param {Array} namespaceParts - Namespace parts taken from node property names.
 */
function populateNamespacePath(nodesPath, namespaceParts) {
	var parent = nodesPath[nodesPath.length - 1].parent;
	nodesPath.push(parent);

	if (namedTypes.MemberExpression.check(parent.node)) {
		namespaceParts.push(parent.node.property.name);

		populateNamespacePath(nodesPath, namespaceParts);
	}
}

/**
 * Replaces namespaced node tree with single identifier and adds a require declaration for the identifier.
 *
 * @param {Array} nodesPath - Node paths that make up the namespace.
 * @param {Array} namespaceParts - Namespace parts taken from node property names.
 */
function replaceNamespacedNodeWithIdentifierAndRequire(nodesPath, namespaceParts, requiresToInsert) {
	var namespace = namespaceParts.join('/');
	var requireIdentifier = namespaceParts[namespaceParts.length - 1];
	var namespaceExpressionToReplace = nodesPath[nodesPath.length - 2];
	var importDeclaration = createRequireDeclaration(requireIdentifier, namespace);

	namespaceExpressionToReplace.replace(builders.identifier(requireIdentifier));
	//TODO: There can be multiple import declarations with same identifier, this must be handled.
	requiresToInsert.set(namespace, importDeclaration);
}

/**
 * Creates a CJS require declaration e.g. 'var <reqIden> = require("importedModule");'
 *
 * @param {string} requireIdentifier - The name of the identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
function createRequireDeclaration(requireIdentifier, importedModule) {
	var requireCall = builders.callExpression(
		builders.identifier('require'),	[
			builders.literal(importedModule)
		]);
	var importDeclaration = builders.variableDeclaration('var', [
		builders.variableDeclarator(
			builders.identifier(requireIdentifier),
			requireCall
		)]);

	return importDeclaration;
}

/**
 * Removes last namespace part and node path if it's a method call.
 *
 * @param {Array} nodesPath - Node paths that make up the namespace.
 * @param {Array} namespaceParts - Namespace parts taken from node property names.
 */
function removeMethodCalls(nodesPath, namespaceParts) {
	var namespacePart = namespaceParts[namespaceParts.length - 1];

	if (namespacePart.match(/^[a-z]/)) {
		nodesPath.pop();
		namespaceParts.pop();
	}
}

/**
 * Called after visiting ast to insert module requires.
 */
function insertRequires(requiresToInsert, programStatements) {
	requiresToInsert.forEach((importDeclaration) => {
		programStatements.unshift(importDeclaration);
	});
}
