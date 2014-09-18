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
	 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
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
	 * @param {NodePath} programNodePath - Program NodePath.
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

	populateNamespacePath(identifierNodePath.parent, nodesPath, namespaceParts);
	storeNodePathsToTransform(namespaceParts, nodesPath.pop(), namespacedExpressionsToTransform);
}

/**
 * Fill provided arrays with nodes and the namespace parts that make up the namespace tree.
 *
 * @param {NodePath} nodePathToCheck - Node path checked to see if it's part of the namespace.
 * @param {NodePath[]} nodesPath - Node paths that make up the namespace.
 * @param {string[]} namespaceParts - Namespace parts that make up the namespace.
 */
function populateNamespacePath(nodePathToCheck, nodesPath, namespaceParts) {
	if (isAstNodePartOfNamespace(nodePathToCheck.node, nodePathToCheck.parent)) {
		nodesPath.push(nodePathToCheck);
		namespaceParts.push(nodePathToCheck.node.property.name);

		populateNamespacePath(nodePathToCheck.parent, nodesPath, namespaceParts);
	}
}

/**
 * Verifies astNode is a namespace node and not a `prototype`, constant or call expression.
 *
 * @param {AstNode} astNode - The ast node to validate.
 * @param {NodePath} parentNodePath - The ast node's parent node path.
 * @returns {boolean} is astNode part of a namespace.
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

function storeNodePathsToTransform(namespaceParts, nodePath, namespaceToNamespaceData) {
	var namespace = namespaceParts.join('/');
	var namespaceData = namespaceToNamespaceData.get(namespace);

	if (namespaceData === undefined) {
		namespaceData = { namespaceParts, nodePathsToTransform: [] };
		namespaceToNamespaceData.set(namespace, namespaceData);
	}

	namespaceData.nodePathsToTransform.push(nodePath);
}

/**
 * @param {string} className - The class name to export.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function insertExport(className, programStatements) {
	var exportsExpression = builders.memberExpression(
		builders.identifier('module'), builders.identifier('exports'), false
	);
	var assignmentExpression = builders.assignmentExpression(
		'=', exportsExpression, builders.identifier(className)
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
	namespacedExpressionsToTransform.forEach((namespaceData, namespace) => {
		var requireIdentifierName = calculateModuleUniqueIdentifier(namespaceData.namespaceParts);
		var moduleUniqueIdentifier = builders.identifier(requireIdentifierName);
		var importDeclaration = createRequireDeclaration(requireIdentifierName, namespace);

		namespaceData.nodePathsToTransform.forEach((nodePathToTransform) => {
			nodePathToTransform.replace(moduleUniqueIdentifier);
		});

		programStatements.unshift(importDeclaration);
	});
}

function calculateModuleUniqueIdentifier(namespaceParts) {
	return namespaceParts.pop();
}

/**
 * Creates a CJS require declaration e.g. 'var <reqIden> = require("importedModule");'
 *
 * @param {string} requireIdentifier - The name of the identifier the require call result is set to.
 * @param {string} importedModule - The module id literal.
 */
function createRequireDeclaration(requireIdentifier, importedModule) {
	var requireCall = builders.callExpression(
		builders.identifier('require'),	[builders.literal(importedModule)]
	);
	var importDeclaration = builders.variableDeclaration(
		'var', [builders.variableDeclarator(builders.identifier(requireIdentifier), requireCall)]
	);

	return importDeclaration;
}
