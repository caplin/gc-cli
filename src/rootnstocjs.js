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
	 * @param {string[]} namespaceRoots - The namespace roots, the top level part.
	 * @param {AstNode[]} programStatements - Program body statements.
	 * @param {string} className - The class name to export.
	 */
	initialize(namespaceRoots, programStatements, className) {
		this._className = className;
		this._moduleIdentifiers = new Set();
		this._programStatements = programStatements;
		this._namespacedNodePathsToTransform = new Map();
		this._namespaceRoots = namespaceRoots.map(rootNamespace => Sequence(rootNamespace));
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		this._namespaceRoots.forEach((namespaceRoot) => {
			if (isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot)) {
				findAndStoreNodePathToTransform(identifierNodePath, this._namespacedNodePathsToTransform);
			}
		});

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		insertExport(this._className, this._programStatements);
		transform(this._namespacedNodePathsToTransform, this._moduleIdentifiers, this._programStatements);
	}
}

/**
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {string} namespaceRoot - The top level of a namespace, the root label.
 * @returns {boolean} true if this namespaced expression should be flattened.
 */
function isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot) {
	var isNodeNamespaced = isNamespacedExpressionNode(identifierNodePath.node, namespaceRoot);
	var isRootOfExpressionTree = identifierNodePath.parent.get('object') === identifierNodePath;

	return isNodeNamespaced && isRootOfExpressionTree;
}

/**
 * @param {NodePath} identifierNodePath - Identifier node path.
 */
function findAndStoreNodePathToTransform(identifierNodePath, namespacedExpressionsToTransform) {
	var nodesPath = [identifierNodePath];
	var namespaceParts = [identifierNodePath.node.name];

	populateNamespacePath(nodesPath, namespaceParts);

	var namespace = namespaceParts.join('/');
	var nodePathsToTransform = namespacedExpressionsToTransform.get(namespace) || [];

	nodePathsToTransform.push(nodesPath);
	namespacedExpressionsToTransform.set(namespace, nodePathsToTransform);
}

/**
 * Fill provided arrays with nodes and the namespace parts that make up the namespace tree.
 *
 * @param {NodePath[]} nodesPath - Node paths that make up the namespace.
 * @param {string[]} namespaceParts - Namespace parts taken from node property names.
 */
function populateNamespacePath(nodesPath, namespaceParts) {
	var parent = nodesPath[nodesPath.length - 1].parent;

	if (isAstNodePartOfNamespace(parent.node, parent.parent)) {
		nodesPath.push(parent);
		namespaceParts.push(parent.node.property.name);

		populateNamespacePath(nodesPath, namespaceParts);
	}
}

/**
 * Verifies the identifier name is a namespace part and not a `prototype` or constant reference.
 *
 * @param {string} identifierName - The identifier name to validate.
 * @returns {boolean} is the name part of a namespace.
 */
function isAstNodePartOfNamespace(astNode, parentNodePath) {
	if (namedTypes.MemberExpression.check(astNode) && namedTypes.Identifier.check(astNode.property)) {
		var identifierName = astNode.property.name;
		var isPrototype = (identifierName === 'prototype');
		var isConstant = identifierName.match(/^[A-Z_-]*$/);
		var isMethodCall = namedTypes.CallExpression.check(parentNodePath.node)
			&& parentNodePath.get('callee').node === astNode;

		return !(isPrototype || isConstant || isMethodCall);
	}

	return false;
}

/**
 * @param {string} className - The class name to export.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function insertExport(className, programStatements) {
	var exportsExpression = builders.memberExpression(
		builders.identifier('module'),
		builders.identifier('exports'),
		false
	);

	var assignmentExpression = builders.assignmentExpression(
		'=',
		exportsExpression,
		builders.identifier(className)
	);

	var exportsStatement = builders.expressionStatement(assignmentExpression);

	programStatements.push(exportsStatement);
}

//You need a list of variables defined in the module.
//None of the newly created require identifiers can clash with them or with each other.
//It's impossible to know all module variables until the entire module has been parsed.
//This means we must keep a reference to all nodes we want to transform and build up a list of all module variables.
//Then at the very end we must mutate all references making sure we provide unique names to all require identifiers.

//We store all namespaced references we want to mutate.
//Map <String, NodePath[]>, the String is the namespace, the NodePath is an array of references that need to be mutated.
//Set <String> contains all the module variables.

//namespacedExpressionsToTransform
function transform(namespacedExpressionsToTransform, moduleIdentifiers, programStatements) {
	namespacedExpressionsToTransform.forEach((nodePathsToTransform, namespace) => {
		var requireIdentifierName = calculateModuleUniqueIdentifier(nodePathsToTransform[0]);
		var moduleUniqueIdentifier = builders.identifier(requireIdentifierName);
		var importDeclaration = createRequireDeclaration(requireIdentifierName, namespace);

		nodePathsToTransform.forEach((nodePathToTransform) => {
			var t = nodePathToTransform.pop();
			t.replace(moduleUniqueIdentifier);
		});

		programStatements.unshift(importDeclaration);
	});
}

function calculateModuleUniqueIdentifier(namespaceNodePaths) {
	var namespacedClass = namespaceNodePaths[namespaceNodePaths.length - 1];

	if (namedTypes.MemberExpression.check(namespacedClass.node)) {
		return namespacedClass.node.property.name;
	} else if (namedTypes.Identifier.check(namespacedClass.node)) {
		return namespacedClass.node.name;
	}

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
