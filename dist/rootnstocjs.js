"use strict";

var _require = require("immutable");

var Iterable = _require.Iterable;

var _require$types = require("recast").types;

var builders = _require$types.builders;
var namedTypes = _require$types.namedTypes;

var _utilsUtilities = require("./utils/utilities");

var createRequireDeclaration = _utilsUtilities.createRequireDeclaration;
var isNamespacedExpressionNode = _utilsUtilities.isNamespacedExpressionNode;
var calculateUniqueModuleVariableId = _utilsUtilities.calculateUniqueModuleVariableId;

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
var rootNamespaceVisitor = exports.rootNamespaceVisitor = {
	/**
  * @param {string[]} namespaceRoots - The namespace roots, the top level parts.
  * @param {AstNode[]} programStatements - Program body statements.
  * @param {string} className - The class name to export.
  * @param {boolean} [insertExport=true] - Should an export statement be added.
  */
	initialize: function initialize(namespaceRoots, programStatements, className) {
		var insertExport = arguments[3] === undefined ? true : arguments[3];

		this._className = className;
		this._insertExport = insertExport;
		this._moduleIdentifiers = new Set();
		this._fullyQualifiedNameData = new Map();
		this._programStatements = programStatements;
		this._namespaceRoots = namespaceRoots.map(function (rootNamespace) {
			return Iterable([rootNamespace]);
		});
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var _this = this;

		this._namespaceRoots.forEach(function (namespaceRoot) {
			if (isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot)) {
				findAndStoreNodePathToTransform(identifierNodePath, _this._fullyQualifiedNameData);
			}
		});

		this.traverse(identifierNodePath);
	},

	/**
  * @param {NodePath} functionDeclarationNodePath - Function Declaration NodePath.
  */
	visitFunctionDeclaration: function visitFunctionDeclaration(functionDeclarationNodePath) {
		var functionName = functionDeclarationNodePath.node.id.name;

		this._moduleIdentifiers.add(functionName);
		this.traverse(functionDeclarationNodePath);
	},

	/**
  * @param {NodePath} variableDeclaratorNodePath - VariableDeclarator NodePath.
  */
	visitVariableDeclarator: function visitVariableDeclarator(variableDeclaratorNodePath) {
		var variableName = variableDeclaratorNodePath.node.id.name;

		this._moduleIdentifiers.add(variableName);

		this.traverse(variableDeclaratorNodePath);
	},

	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		moveProgramCommentsIntoBody(programNodePath);
		preventClashesWithGlobals(this._moduleIdentifiers);
		if (this._insertExport) {
			insertExportsStatement(this._className, programNodePath.get("body"));
		}
		findUniqueIdentifiersForModules(this._fullyQualifiedNameData, this._moduleIdentifiers);
		transformAllNamespacedExpressions(this._fullyQualifiedNameData, this._programStatements);
	}
};

/**
 * Does identifier value match a namespace root and is it at the root of an expression tree.
 *
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {string} namespaceRoot - The top level of a namespace, the root label.
 * @returns {boolean} true if this namespaced expression should be flattened.
 */
function isNodeNamespacedAndTheRootOfANamespace(identifierNodePath, namespaceRoot) {
	var isNodeNamespaced = isNamespacedExpressionNode(identifierNodePath.node, namespaceRoot);
	var isRootOfExpressionTree = identifierNodePath.parent.get("object") === identifierNodePath;

	return isNodeNamespaced && isRootOfExpressionTree;
}

/**
 * Finds fully qualified leaf nodes (class name references) and stores them.
 *
 * @param {NodePath} identifierNodePath - Identifier node path.
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 */
function findAndStoreNodePathToTransform(identifierNodePath, fullyQualifiedNameData) {
	var nodesPath = [identifierNodePath];
	var namespaceParts = [identifierNodePath.node.name];

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
		var identifierName = astNode.property.name;
		var isPrototype = identifierName === "prototype";
		var isMethodCall = namedTypes.CallExpression.check(parentNodePath.node) && parentNodePath.get("callee").node === astNode;

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
	var isConstant = identifierName.match(/^[A-Z_-]*$/);
	var lastNamespacePart = namespaceParts[namespaceParts.length - 1];
	var firstCharOfLastNamespacePart = lastNamespacePart.substr(0, 1);
	var isParentClassLike = firstCharOfLastNamespacePart === firstCharOfLastNamespacePart.toLocaleUpperCase();

	if (isConstant) {
		console.log(identifierName, "assumed to be constant of class", namespaceParts.join("."));
	} else if (isParentClassLike) {
		console.log(identifierName, "assumed to be property of class", namespaceParts.join("."));
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
	var namespace = namespaceParts.join("/");
	var namespaceData = fullyQualifiedNameData.get(namespace);

	if (namespaceData === undefined) {
		namespaceData = { namespaceParts: namespaceParts, nodePathsToTransform: [], moduleVariableId: "" };
		fullyQualifiedNameData.set(namespace, namespaceData);
	}

	namespaceData.nodePathsToTransform.push(nodePath);
}

/**
 * @param {string} className - The class name to export.
 * @param {NodePath} programBodyNodePath - Program body statements.
 */
function insertExportsStatement(className, programBodyNodePath) {
	var lastStatement = programBodyNodePath.get(programBodyNodePath.value.length - 1);
	var exportExpression = retrieveExportExpression(lastStatement, className);
	var exportStatement = createExportStatement(exportExpression);

	programBodyNodePath.push(exportStatement);
}

/**
 * Retrieve the expression to export, if the module ends in a return statement export that node.
 *
 * @param   {NodePath} lastStatement - Last statement in the module.
 * @param   {string} className - The class name to export.
 * @returns {AstNode} node to export.
 */
function retrieveExportExpression(lastStatement, className) {
	if (namedTypes.ReturnStatement.check(lastStatement.node)) {
		var returnArgument = lastStatement.node.argument;

		lastStatement.replace();

		return returnArgument;
	}

	return builders.identifier(className);
}

/**
 * Create the module export expression.
 *
 * @param   {AstNode} exportedExpression - expression to export.
 * @returns {AstNode} module exports node.
 */
function createExportStatement(exportedExpression) {
	var exportsExpression = builders.memberExpression(builders.identifier("module"), builders.identifier("exports"), false);
	var assignmentExpression = builders.assignmentExpression("=", exportsExpression, exportedExpression);

	return builders.expressionStatement(assignmentExpression);
}

/**
 * Calculate and store a unique variable name for a required module.
 *
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 * @param {Set} moduleIdentifiers - all variable names declared in the module.
 */
function findUniqueIdentifiersForModules(fullyQualifiedNameData, moduleIdentifiers) {
	fullyQualifiedNameData.forEach(function (namespaceData) {
		var moduleVariableId = namespaceData.namespaceParts.pop();
		var uniqueModuleVariableId = calculateUniqueModuleVariableId(moduleVariableId, moduleIdentifiers, namespaceData.namespaceParts);

		moduleIdentifiers.add(uniqueModuleVariableId);
		namespaceData.moduleVariableId = uniqueModuleVariableId;
	});
}

/**
 * Move any comments from the program node to the body of the program if the first statement
 * has no comments attached to it.
 *
 * @param {NodePath} programNodePath Program node path
 */
function moveProgramCommentsIntoBody(programNodePath) {
	var programComments = programNodePath.node.comments;
	var programStatements = programNodePath.get("body");

	// If the program node has comments and the first program statement has no comments
	if (programComments && programStatements.value[0].comments === undefined) {
		programNodePath.node.comments = undefined;
		programStatements.value[0].comments = programComments;
	}
}

/**
 * Replace all namespaced expressions with their module id and insert requires for their module.
 *
 * @param {Map<string, NamespaceData>} fullyQualifiedNameData - fully qualified name data.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function transformAllNamespacedExpressions(fullyQualifiedNameData, programStatements) {
	fullyQualifiedNameData.forEach(function (_ref, namespace) {
		var moduleVariableId = _ref.moduleVariableId;
		var nodePathsToTransform = _ref.nodePathsToTransform;

		var moduleIdentifier = builders.identifier(moduleVariableId);
		var importDeclaration = createRequireDeclaration(moduleIdentifier, namespace);

		programStatements.unshift(importDeclaration);
		nodePathsToTransform.forEach(function (nodePathToTransform) {
			return nodePathToTransform.replace(moduleIdentifier);
		});
	});
}

/**
 * Ensure module identifiers don't clash with global identifiers.
 *
 * @param {Set} moduleIdentifiers - all variable names declared in the module.
 */
function preventClashesWithGlobals(moduleIdentifiers) {
	moduleIdentifiers.add("Number").add("Error");
}
Object.defineProperty(exports, "__esModule", {
	value: true
});
