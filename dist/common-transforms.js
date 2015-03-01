"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

/**
 * Parses every streamed file and provides its AST.
 *
 * @returns {Function} Stream transform implementation which parses JS files.
 */
exports.parseJSFile = parseJSFile;

/**
 * Expand any var namespace aliases used in the module.
 *
 * @param {string[]} rootNamespaces - Array of roots of namespaces.
 * @returns {Function} Stream transform implementation which .
 */
exports.expandVarNamespaceAliases = expandVarNamespaceAliases;

/**
 * This transform is use case specific in that it replaces global references to SLJS with required ones.
 * The transform is multi-stage as it uses more generic transforms.
 *
 * @returns {Function} Stream transform implementation which transforms SLJS usage.
 */
exports.transformSLJSUsage = transformSLJSUsage;

/**
 * Given namespace roots flatten all classes referenced in those namespaces and require them.
 *
 * @param {string[]} rootNamespaces - Array of roots of namespaces to convert to CJS modules.
 * @param {boolean} [insertExport=true] - Should an export statement be added.
 * @returns {Function} Stream transform implementation which replaces all global namespaced code with module references.
 */
exports.convertGlobalsToRequires = convertGlobalsToRequires;

/**
 * Replace use of caplin.extend/implement with topiarist.
 *
 * @returns {Function} Stream transform implementation which replaces caplin with topiarist classes.
 */
exports.transformClassesToUseTopiarist = transformClassesToUseTopiarist;

/**
 * Replace use of caplin.core.ServiceRegistry.getService() with require('service!');
 *
 * @returns {Function} Stream transform implementation
 */
exports.transformGetServiceToRequire = transformGetServiceToRequire;

/**
 * Certain required module IDs don't exist, this transform removes them.
 *
 * @param {Set<string>} moduleIDsToRemove - The module Ids to remove.
 * @returns {Function} Stream transform implementation which removes specified cjs requires.
 */
exports.removeCJSModuleRequires = removeCJSModuleRequires;

/**
 * This transform adds requires to a module based on it finding certain identifiers in the module.
 * It is meant to allow discoverability of global references to libraries in modules and conversion to module imports.
 *
 * @param {Map<Iterable<string>, string>} libraryIdentifiersToRequire - The identifiers that should be required.
 */
exports.addRequiresForLibraries = addRequiresForLibraries;

/**
 * This transform is use case specific in that it replaces use of one i18n library with another.
 * The transform is multi-stage as it uses more generic transforms.
 *
 * @returns {Function} Stream transform implementation which replaces i18n usage with another library.
 */
exports.transformI18nUsage = transformI18nUsage;

/**
 * This transform replaces non standard library includes with standard CJS module requires.
 *
 * @param {Set<string>} libraryIncludesToRequire - The library includes to replace with requires when found.
 * @param {Iterable<string>} libraryIncludeIterable - A sequence of names that correspond to a library include.
 * @returns {Function} Stream transform implementation which replaces library includes with module requires.
 */
exports.replaceLibraryIncludesWithRequires = replaceLibraryIncludesWithRequires;

/**
 * This transform adds 'use strict' as the first line of a module and removes any other instances.
 *
 * @returns {Function} Stream transform implementation which makes a module strict mode.
 */
exports.addModuleUseStrict = addModuleUseStrict;

/**
 * Parse AST and set it on the `contents` property of the FileMetadata argument passed into the transform.
 *
 * @returns {Function} Stream transform implementation which sets parsed AST on `contents` of FileMetadata.
 */
exports.convertASTToBuffer = convertASTToBuffer;
var chalk = require("chalk");
var through2 = require("through2");
var parse = require("recast").parse;
var print = require("recast").print;
var visit = require("recast").visit;

var _require = require("immutable");

var Iterable = _require.Iterable;

var builders = require("recast").types.builders;

var _globalCompiler = require("global-compiler");

var orMatchers = _globalCompiler.orMatchers;
var literalMatcher = _globalCompiler.literalMatcher;
var composeMatchers = _globalCompiler.composeMatchers;
var identifierMatcher = _globalCompiler.identifierMatcher;
var callExpressionMatcher = _globalCompiler.callExpressionMatcher;
var memberExpressionMatcher = _globalCompiler.memberExpressionMatcher;
var variableDeclaratorMatcher = _globalCompiler.variableDeclaratorMatcher;
var extractParent = _globalCompiler.extractParent;
var extractProperties = _globalCompiler.extractProperties;
var composeTransformers = _globalCompiler.composeTransformers;
var moduleIdVisitor = _globalCompiler.moduleIdVisitor;
var rootNamespaceVisitor = _globalCompiler.rootNamespaceVisitor;
var nodePathLocatorVisitor = _globalCompiler.nodePathLocatorVisitor;
var flattenMemberExpression = _globalCompiler.flattenMemberExpression;
var cjsRequireRemoverVisitor = _globalCompiler.cjsRequireRemoverVisitor;
var addModuleUseStrictVisitor = _globalCompiler.addModuleUseStrictVisitor;
var verifyVarIsAvailableVisitor = _globalCompiler.verifyVarIsAvailableVisitor;
var varNamespaceAliasExpanderVisitor = _globalCompiler.varNamespaceAliasExpanderVisitor;
var addRequireForGlobalIdentifierVisitor = _globalCompiler.addRequireForGlobalIdentifierVisitor;
var replaceLibraryIncludesWithRequiresVisitor = _globalCompiler.replaceLibraryIncludesWithRequiresVisitor;

var _utilsUtilities = require("./utils/utilities");

var getFileNamespaceParts = _utilsUtilities.getFileNamespaceParts;
var transformASTAndPushToNextStream = _utilsUtilities.transformASTAndPushToNextStream;

var getServiceMatchers = require("./matchers/service-registry").getServiceMatchers;

var getServiceNodesReceiver = require("./receivers/service-registry").getServiceNodesReceiver;

var caplinRequireMatcher = composeMatchers(literalMatcher("caplin"), callExpressionMatcher({ callee: identifierMatcher("require") }), variableDeclaratorMatcher({ id: identifierMatcher("caplin") }));

var caplinInheritanceMatcher = composeMatchers(identifierMatcher("caplin"), orMatchers(memberExpressionMatcher({ property: identifierMatcher("extend") }), memberExpressionMatcher({ property: identifierMatcher("implement") })), callExpressionMatcher());

var caplinInheritanceMatchers = new Map();

caplinInheritanceMatchers.set("Literal", caplinRequireMatcher);
caplinInheritanceMatchers.set("Identifier", caplinInheritanceMatcher);

var literal = builders.literal;
var identifier = builders.identifier;

var caplinRequireTransformer = composeTransformers(literal("topiarist"), extractParent(), extractParent(), extractProperties("id"), identifier("topiarist"));

var caplinInheritanceToExtendTransformer = composeTransformers(identifier("topiarist"), extractParent(), extractProperties("property"), identifier("extend"));

var caplinInheritanceToInheritTransformer = composeTransformers(identifier("topiarist"), extractParent(), extractProperties("property"), identifier("inherit"));

function caplinInheritanceMatchedNodesReceiver(matchedNodePaths) {
	var _ref = matchedNodePaths.get("Literal") || [];

	var _ref2 = _slicedToArray(_ref, 1);

	var caplinRequireVarDeclaration = _ref2[0];

	var caplinInheritanceExpressions = matchedNodePaths.get("Identifier") || [];

	if (caplinInheritanceExpressions.length > 0) {
		caplinRequireTransformer(caplinRequireVarDeclaration);
	} else if (caplinRequireVarDeclaration) {
		caplinRequireVarDeclaration.parent.parent.prune();
	}

	caplinInheritanceExpressions.forEach(function (identifierNodePath, index) {
		if (index === 0) {
			caplinInheritanceToExtendTransformer(identifierNodePath);
		} else {
			caplinInheritanceToInheritTransformer(identifierNodePath);
		}
	});
}
function parseJSFile() {
	return through2.obj(function (vinylFile, encoding, callback) {
		console.log(chalk.green("Parsing"), chalk.bold(vinylFile.relative));

		var fileAST = parse(vinylFile.contents.toString());

		vinylFile.ast = fileAST;
		this.push(vinylFile);
		callback();
	});
}

function expandVarNamespaceAliases(rootNamespaces) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		varNamespaceAliasExpanderVisitor.initialize(rootNamespaces);
		transformASTAndPushToNextStream(fileMetadata, varNamespaceAliasExpanderVisitor, this, callback);
	});
}

function transformSLJSUsage() {
	return through2.obj(function (fileMetadata, encoding, callback) {
		//Verify that the streamlink variable is free to use in this module, if not generate a variation on it that is.
		verifyVarIsAvailableVisitor.initialize();
		visit(fileMetadata.ast, verifyVarIsAvailableVisitor);
		var freeSLJSVariation = verifyVarIsAvailableVisitor.getFreeVariation("streamlink");

		//Replace all calls to a certain namespace with calls to the new SLJS identifier.
		flattenMemberExpression.initialize(["caplin", "streamlink"], freeSLJSVariation);
		visit(fileMetadata.ast, flattenMemberExpression);

		//Add a require that requires SLJS into the module.
		var libraryIdentifiersToRequire = new Map([[Iterable([freeSLJSVariation]), "sljs"]]);

		addRequireForGlobalIdentifierVisitor.initialize(libraryIdentifiersToRequire, fileMetadata.ast.program.body);
		visit(fileMetadata.ast, addRequireForGlobalIdentifierVisitor);

		this.push(fileMetadata);
		callback();
	});
}

function convertGlobalsToRequires(rootNamespaces, insertExport) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		var className = getFileNamespaceParts(fileMetadata).pop();

		rootNamespaceVisitor.initialize(rootNamespaces, fileMetadata.ast.program.body, className, insertExport);
		transformASTAndPushToNextStream(fileMetadata, rootNamespaceVisitor, this, callback);
	});
}

function transformClassesToUseTopiarist() {
	return through2.obj(function (fileMetadata, encoding, callback) {
		nodePathLocatorVisitor.initialize(caplinInheritanceMatchedNodesReceiver, caplinInheritanceMatchers);
		transformASTAndPushToNextStream(fileMetadata, nodePathLocatorVisitor, this, callback);
	});
}

function transformGetServiceToRequire() {
	// This transform expects all namespace aliases to be expanded.
	return through2.obj(function (fileMetadata, encoding, callback) {
		nodePathLocatorVisitor.initialize(getServiceNodesReceiver, getServiceMatchers);
		transformASTAndPushToNextStream(fileMetadata, nodePathLocatorVisitor, this, callback);
	});
}

function removeCJSModuleRequires(moduleIDsToRemove) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		cjsRequireRemoverVisitor.initialize(moduleIDsToRemove);
		transformASTAndPushToNextStream(fileMetadata, cjsRequireRemoverVisitor, this, callback);
	});
}

function addRequiresForLibraries(libraryIdentifiersToRequire) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		addRequireForGlobalIdentifierVisitor.initialize(libraryIdentifiersToRequire, fileMetadata.ast.program.body);
		transformASTAndPushToNextStream(fileMetadata, addRequireForGlobalIdentifierVisitor, this, callback);
	});
}

function transformI18nUsage() {
	return through2.obj(function (fileMetadata, encoding, callback) {
		//Verify that the i18n variable is free to use in this module, if not generate a variation on it that is.
		verifyVarIsAvailableVisitor.initialize();
		visit(fileMetadata.ast, verifyVarIsAvailableVisitor);
		var freeI18NVariation = verifyVarIsAvailableVisitor.getFreeVariation("i18n");

		//Convert all requires with a certain ID to another ID and variable identifer.
		var moduleIdsToConvert = new Map([["ct", ["br/I18n", freeI18NVariation]]]);
		moduleIdVisitor.initialize(moduleIdsToConvert);
		visit(fileMetadata.ast, moduleIdVisitor);

		//Replace all calls to a certain namespace with calls to the new i18n identifier.
		flattenMemberExpression.initialize(["ct", "i18n"], freeI18NVariation);
		visit(fileMetadata.ast, flattenMemberExpression);

		this.push(fileMetadata);
		callback();
	});
}

function replaceLibraryIncludesWithRequires(libraryIncludesToRequire, libraryIncludeIterable) {
	return through2.obj(function (fileMetadata, encoding, callback) {
		replaceLibraryIncludesWithRequiresVisitor.initialize(libraryIncludesToRequire, libraryIncludeIterable);
		transformASTAndPushToNextStream(fileMetadata, replaceLibraryIncludesWithRequiresVisitor, this, callback);
	});
}

function addModuleUseStrict() {
	return through2.obj(function (fileMetadata, encoding, callback) {
		transformASTAndPushToNextStream(fileMetadata, addModuleUseStrictVisitor, this, callback);
	});
}

function convertASTToBuffer() {
	return through2.obj(function (fileMetadata, encoding, callback) {
		var convertedCode = print(fileMetadata.ast, { wrapColumn: 120 }).code;
		var convertedCodeBuffer = new Buffer(convertedCode);

		fileMetadata.contents = convertedCodeBuffer;
		this.push(fileMetadata);
		callback();
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});
