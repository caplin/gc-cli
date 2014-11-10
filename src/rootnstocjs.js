const {Iterable} = require('immutable');
const {builders, namedTypes} = require('ast-types');

import {
	createRequireDeclaration,
	isNamespacedExpressionNode,
	calculateUniqueModuleVariableId
} from './utils/utilities';

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
 * Namespace data.
 *
 * @typedef {Object} NamespaceData
 * @property {string[]} namespaceParts - the labels that make up a fully qualified namespace.
 * @property {NodePath[]} nodePathsToTransform - all the leaf NodePaths for this fully qualified namespace.
 * @property {string} moduleVariableId - the identifier name that references to this namespace will use post-transform.
 */

/**
 * Converts all Expressions under the specified root namespaces.
 * They will be mutated to flat Identifiers along with newly inserted CJS require statements.
 */
export const rootNamespaceVisitor = {
	/**
	 * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
	 * @param {AstNode[]} programStatements - Program body statements.
	 * @param {string} className - The class name to export.
	 */
	initialize(namespaceRoots, programStatements, className) {
		this._className = className;
		this._moduleIdentifiers = new Set();
		this._fullyQualifiedNameData = new Map();
		this._programStatements = programStatements;
		this._namespaceRoots = namespaceRoots.map(rootNamespace => Iterable([rootNamespace]));
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		this._namespaceRoots.forEach((namespaceRoot) => {
			if (isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot)) {
				findAndStoreNodePathToTransform(identifierNodePath, this._fullyQualifiedNameData);
			}
		});

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} functionDeclarationNodePath - Function Declaration NodePath.
	 */
	visitFunctionDeclaration(functionDeclarationNodePath) {
		const functionName = functionDeclarationNodePath.node.id.name;

		this._moduleIdentifiers.add(functionName);
		this.traverse(functionDeclarationNodePath);
	},

	/**
	 * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
	 */
	visitVariableDeclarator(variableDeclaratorNodePath) {
		const variableName = variableDeclaratorNodePath.node.id.name;

		this._moduleIdentifiers.add(variableName);

		this.traverse(variableDeclaratorNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		preventClashesWithGlobals(this._moduleIdentifiers);
		insertExportsStatement(this._className, this._programStatements);
		findUniqueIdentifiersForModules(this._fullyQualifiedNameData, this._moduleIdentifiers);
		transformAllNamespacedExpressions(this._fullyQualifiedNameData, this._programStatements);
	}
}

/**
 * Does identifier value match a namespace root and is it at the root of an expression tree.
 *
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {string} namespaceRoot - The top level of a namespace, the root label.
 * @returns {boolean} true if this namespaced expression should be flattened.
 */
function isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot) {
	const isNodeNamespaced = isNamespacedExpressionNode(identifierNodePath.node, namespaceRoot);
	const isRootOfExpressionTree = identifierNodePath.parent.get('object') === identifierNodePath;

	return isNodeNamespaced && isRootOfExpressionTree;
}

/**
 * Finds fully qualified leaf nodes (class name references) and stores them.
 *
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 */
function findAndStoreNodePathToTransform(identifierNodePath, fullyQualifiedNameData) {
	const nodesPath = [identifierNodePath];
	const namespaceParts = [identifierNodePath.node.name];

	populateNamespacePath(identifierNodePath.parent, nodesPath, namespaceParts);
	storeNodePathInFQNameData(namespaceParts, nodesPath.pop(), fullyQualifiedNameData);
}

/**
 * Fill provided arrays with nodes and the namespace parts that make up the namespace tree.
 *
 * @param {NodePath} nodePathToCheck - Node path checked to see if it's part of the namespace.
 * @param {NodePath[]} nodesPath - Node paths that make up the namespace.
 * @param {string[]} namespaceParts - Namespace parts that make up the namespace.
 */
function populateNamespacePath(nodePathToCheck, nodesPath, namespaceParts) {
	if (isAstNodePartOfNamespace(nodePathToCheck.node, nodePathToCheck.parent, namespaceParts)) {
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
 * @param {string[]} namespaceParts - Namespace parts that make up the namespace.
 * @returns {boolean} is astNode part of a namespace.
 */
function isAstNodePartOfNamespace(astNode, parentNodePath, namespaceParts) {
	if (namedTypes.MemberExpression.check(astNode) && namedTypes.Identifier.check(astNode.property)) {
		const identifierName = astNode.property.name;
		const isPrototype = (identifierName === 'prototype');
		const isMethodCall = namedTypes.CallExpression.check(parentNodePath.node)
			&& parentNodePath.get('callee').node === astNode;

		return !(isPrototype || isMethodCall || isAssumedToBeAClassProperty(identifierName, namespaceParts));
	}

	return false;
}

/**
 * Some class properties are difficult to statically verify so we use heuristics instead.
 * If an identifier is all upper case we consider it a constant and if a property has a preceding node
 * starting with an upper case letter we consider it a class property.
 *
 * @param {string} identifierName - Name of identifier being checked.
 * @param {string[]} namespaceParts - Namespace parts that make up the namespace.
 * @returns {boolean} is astNode assumed to be a class property.
 */
function isAssumedToBeAClassProperty(identifierName, namespaceParts) {
	const isConstant = identifierName.match(/^[A-Z_-]*$/);
	const lastNamespacePart = namespaceParts[namespaceParts.length - 1];
	const firstCharOfLastNamespacePart = lastNamespacePart.substr(0, 1);
	const isParentClassLike = (firstCharOfLastNamespacePart === firstCharOfLastNamespacePart.toLocaleUpperCase());

	if (isConstant) {
		console.log(identifierName, 'assumed to be constant of class', namespaceParts.join('.'));
	} else if (isParentClassLike) {
		console.log(identifierName, 'assumed to be property of class', namespaceParts.join('.'));
	}

	return isConstant || isParentClassLike;
}

/**
 * Stores NodePath in fqn map NamespaceData value keyed by fqn, creates NamespaceData if required.
 *
 * @param {string[]} namespaceParts - Namespace parts that make up the namespace.
 * @param {NodePath} nodePath - Leaf NodePath of fully qualified name (class name reference).
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 */
function storeNodePathInFQNameData(namespaceParts, nodePath, fullyQualifiedNameData) {
	const namespace = namespaceParts.join('/');
	let namespaceData = fullyQualifiedNameData.get(namespace);

	if (namespaceData === undefined) {
		namespaceData = { namespaceParts, nodePathsToTransform: [], moduleVariableId: '' };
		fullyQualifiedNameData.set(namespace, namespaceData);
	}

	namespaceData.nodePathsToTransform.push(nodePath);
}

/**
 * @param {string} className - The class name to export.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function insertExportsStatement(className, programStatements) {
	const exportsExpression = builders.memberExpression(
		builders.identifier('module'), builders.identifier('exports'), false
	);
	const assignmentExpression = builders.assignmentExpression(
		'=', exportsExpression, builders.identifier(className)
	);
	const exportsStatement = builders.expressionStatement(assignmentExpression);

	programStatements.push(exportsStatement);
}

/**
 * Calculate and store a unique variable name for a required module.
 *
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 * @param {Set} moduleIdentifiers - all variable names declared in the module.
 */
function findUniqueIdentifiersForModules(fullyQualifiedNameData, moduleIdentifiers) {
	fullyQualifiedNameData.forEach((namespaceData) => {
		const moduleVariableId = namespaceData.namespaceParts.pop();
		const uniqueModuleVariableId = calculateUniqueModuleVariableId(moduleVariableId, moduleIdentifiers);

		moduleIdentifiers.add(uniqueModuleVariableId);
		namespaceData.moduleVariableId = uniqueModuleVariableId;
	});
}

/**
 * Replace all namespaced expressions with their module id and insert requires for their module.
 *
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function transformAllNamespacedExpressions(fullyQualifiedNameData, programStatements) {
	fullyQualifiedNameData.forEach(({moduleVariableId, nodePathsToTransform}, namespace) => {
		const moduleIdentifier = builders.identifier(moduleVariableId);
		const importDeclaration = createRequireDeclaration(moduleIdentifier, namespace);

		programStatements.unshift(importDeclaration);
		nodePathsToTransform.forEach((nodePathToTransform) => nodePathToTransform.replace(moduleIdentifier));
	});
}

/**
 * Ensure module identifiers don't clash with global identifiers.
 *
 * @param {Set} moduleIdentifiers - all variable names declared in the module.
 */
function preventClashesWithGlobals(moduleIdentifiers) {
	moduleIdentifiers.add('Number').add('Error');
}
