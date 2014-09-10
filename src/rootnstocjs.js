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
 * Converts all Expressions under the specified root namespace.
 * They will be mutated to flat Identifiers along with newly inserted CJS require statements.
 */
export var rootNamespaceVisitor = {
	/**
	 * @param {string} rootNamespace - The root namespace.
	 * @param {AstNode[]} programStatements - Program body statements.
	 */
	initialize(rootNamespace, programStatements) {
		this._requiresToInsert = new Map();
		this._rootNamespace = rootNamespace;
		this._programStatements = programStatements;
		this._rootNamespaceS = Sequence(rootNamespace);
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		if (isNamespacedExpressionNode(identifierNodePath.node, this._rootNamespaceS)) {
			replaceNamespaceWithIdentifier(identifierNodePath, this._requiresToInsert);
		}

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
 *
 * @param {?} identifierNodePath - .
 * @param {?} requiresToInsert - .
 */
function replaceNamespaceWithIdentifier(identifierNodePath, requiresToInsert) {
	var nodesPath = [identifierNodePath];
	var namespaceParts = [identifierNodePath.node.name];

	populateNamespacePath(nodesPath, namespaceParts);

	var parentNode = nodesPath[nodesPath.length - 1].node;

	if (namedTypes.NewExpression.check(parentNode)) {
		createAndInsertRequire(nodesPath, namespaceParts, requiresToInsert);
	} else if (namedTypes.CallExpression.check(parentNode)) {
		createAndInsertRequire(nodesPath, namespaceParts, requiresToInsert);
	}
}

/**
 *
 * @param {Array} nodesPath - .
 * @param {Array} namespaceParts - .
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
 *
 * @param {Array} nodesPath - .
 * @param {Array} namespaceParts - .
 */
function createAndInsertRequire(nodesPath, namespaceParts, requiresToInsert) {
	var namespace = namespaceParts.join('.');
	var requireIdentifier = namespaceParts[namespaceParts.length - 1];
	var namespaceExpressionToReplace = nodesPath[nodesPath.length - 2];
	var importDeclaration = createRequireDeclaration(requireIdentifier, namespace);

	console.log(namespaceParts);

	namespaceExpressionToReplace.replace(builders.identifier(requireIdentifier));
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
 * Called after visiting ast to insert module requires.
 */
function insertRequires(requiresToInsert, programStatements) {
	requiresToInsert.forEach((importDeclaration) => {
		programStatements.unshift(importDeclaration);
	});
}
