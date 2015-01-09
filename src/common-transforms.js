var chalk = require('chalk');
var through2 = require('through2');
var parse = require('recast').parse;
var print = require('recast').print;
var visit = require('recast').visit;
const {Iterable} = require('immutable');
const {builders} = require('ast-types');

import {
	moduleIdVisitor,
	rootNamespaceVisitor,
	nodePathLocatorVisitor,
	flattenMemberExpression,
	cjsRequireRemoverVisitor,
	addModuleUseStrictVisitor,
	verifyVarIsAvailableVisitor,
	varNamespaceAliasExpanderVisitor,
	addRequireForGlobalIdentifierVisitor,
	replaceLibraryIncludesWithRequiresVisitor
} from 'global-compiler/index';

import {
	parent,
	extract,
	composeTransformers
} from 'global-compiler/utils/transformers';

import {
	or,
	composeMatchers,
	literal as literalMatcher,
	identifier as identifierMatcher,
	callExpression as callExpressionMatcher,
	memberExpression as memberExpressionMatcher,
	variableDeclarator as variableDeclaratorMatcher
} from 'global-compiler/utils/matchers';

import {
	getFileNamespaceParts,
	transformASTAndPushToNextStream
} from './utils/utilities';

const caplinRequireMatcher = composeMatchers(
	literalMatcher('caplin'),
	callExpressionMatcher({callee: identifierMatcher('require')}),
	variableDeclaratorMatcher({id: identifierMatcher('caplin')})
);

const caplinInheritanceMatcher = composeMatchers(
	identifierMatcher('caplin'),
	or(
		memberExpressionMatcher({property: identifierMatcher('extend')}),
		memberExpressionMatcher({property: identifierMatcher('implement')})
	),
	callExpressionMatcher()
);

const caplinInheritanceMatchers = new Map();

caplinInheritanceMatchers.set('Literal', caplinRequireMatcher);
caplinInheritanceMatchers.set('Identifier', caplinInheritanceMatcher);

const {literal, identifier} = builders;

const caplinRequireTransformer = composeTransformers(
	literal('topiarist'),
	parent(),
	parent(),
	extract('id'),
	identifier('topiarist')
);

const caplinInheritanceToExtendTransformer = composeTransformers(
	identifier('topiarist'),
	parent(),
	extract('property'),
	identifier('extend')
);

const caplinInheritanceToInheritTransformer = composeTransformers(
	identifier('topiarist'),
	parent(),
	extract('property'),
	identifier('inherit')
);

function caplinInheritanceMatchedNodesReceiver(matchedNodePaths) {
	const [caplinRequireVarDeclaration] = matchedNodePaths.get('Literal') || [];
	const caplinInheritanceExpressions = matchedNodePaths.get('Identifier') || [];

	if (caplinInheritanceExpressions.length > 0) {
		caplinRequireTransformer(caplinRequireVarDeclaration);
	} else if (caplinRequireVarDeclaration) {
		caplinRequireVarDeclaration.parent.parent.prune();
	}

	caplinInheritanceExpressions.forEach((identifierNodePath, index) => {
		if (index === 0) {
			caplinInheritanceToExtendTransformer(identifierNodePath);
		} else {
			caplinInheritanceToInheritTransformer(identifierNodePath);
		}
	});
}

/**
 * Parses every streamed file and provides its AST.
 *
 * @returns {Function} Stream transform implementation which parses JS files.
 */
export function parseJSFile() {
	return through2.obj(function(vinylFile, encoding, callback) {
		console.log(chalk.green('Parsing'), chalk.bold(vinylFile.relative));

		var fileAST = parse(vinylFile.contents.toString());

		vinylFile.ast = fileAST;
		this.push(vinylFile);
		callback();
	});
}

/**
 * Expand any var namespace aliases used in the module.
 *
 * @param {string[]} rootNamespaces - Array of roots of namespaces.
 * @returns {Function} Stream transform implementation which .
 */
export function expandVarNamespaceAliases(rootNamespaces) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		varNamespaceAliasExpanderVisitor.initialize(rootNamespaces);
		transformASTAndPushToNextStream(fileMetadata, varNamespaceAliasExpanderVisitor, this, callback);
	});
}

/**
 * This transform is use case specific in that it replaces global references to SLJS with required ones.
 * The transform is multi-stage as it uses more generic transforms.
 *
 * @returns {Function} Stream transform implementation which transforms SLJS usage.
 */
export function transformSLJSUsage() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		//Verify that the streamlink variable is free to use in this module, if not generate a variation on it that is.
		verifyVarIsAvailableVisitor.initialize();
		visit(fileMetadata.ast, verifyVarIsAvailableVisitor);
		var freeSLJSVariation = verifyVarIsAvailableVisitor.getFreeVariation('streamlink');

		//Replace all calls to a certain namespace with calls to the new SLJS identifier.
		flattenMemberExpression.initialize(['caplin', 'streamlink'], freeSLJSVariation);
		visit(fileMetadata.ast, flattenMemberExpression);

		//Add a require that requires SLJS into the module.
		var libraryIdentifiersToRequire = new Map([
			[Iterable([freeSLJSVariation]), 'sljs']
		]);

		addRequireForGlobalIdentifierVisitor.initialize(libraryIdentifiersToRequire, fileMetadata.ast.program.body);
		visit(fileMetadata.ast, addRequireForGlobalIdentifierVisitor);

		this.push(fileMetadata);
		callback();
	});
}

/**
 * Given namespace roots flatten all classes referenced in those namespaces and require them.
 *
 * @param {string[]} rootNamespaces - Array of roots of namespaces to convert to CJS modules.
 * @param {boolean} [insertExport=true] - Should an export statement be added.
 * @returns {Function} Stream transform implementation which replaces all global namespaced code with module references.
 */
export function convertGlobalsToRequires(rootNamespaces, insertExport) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		var className = getFileNamespaceParts(fileMetadata).pop();

		rootNamespaceVisitor.initialize(rootNamespaces, fileMetadata.ast.program.body, className, insertExport);
		transformASTAndPushToNextStream(fileMetadata, rootNamespaceVisitor, this, callback);
	});
}

/**
 * Replace use of caplin.extend/implement with topiarist.
 *
 * @returns {Function} Stream transform implementation which replaces caplin with topiarist classes.
 */
export function transformClassesToUseTopiarist() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		nodePathLocatorVisitor.initialize(caplinInheritanceMatchedNodesReceiver, caplinInheritanceMatchers);
		transformASTAndPushToNextStream(fileMetadata, nodePathLocatorVisitor, this, callback);
	});
}

/**
 * Certain required module IDs don't exist, this transform removes them.
 *
 * @param {Set<string>} moduleIDsToRemove - The module Ids to remove.
 * @returns {Function} Stream transform implementation which removes specified cjs requires.
 */
export function removeCJSModuleRequires(moduleIDsToRemove) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		cjsRequireRemoverVisitor.initialize(moduleIDsToRemove);
		transformASTAndPushToNextStream(fileMetadata, cjsRequireRemoverVisitor, this, callback);
	});
}

/**
 * This transform adds requires to a module based on it finding certain identifiers in the module.
 * It is meant to allow discoverability of global references to libraries in modules and conversion to module imports.
 *
 * @param {Map<Iterable<string>, string>} libraryIdentifiersToRequire - The identifiers that should be required.
 */
export function addRequiresForLibraries(libraryIdentifiersToRequire) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		addRequireForGlobalIdentifierVisitor.initialize(libraryIdentifiersToRequire, fileMetadata.ast.program.body);
		transformASTAndPushToNextStream(fileMetadata, addRequireForGlobalIdentifierVisitor, this, callback);
	});
}

/**
 * This transform is use case specific in that it replaces use of one i18n library with another.
 * The transform is multi-stage as it uses more generic transforms.
 *
 * @returns {Function} Stream transform implementation which replaces i18n usage with another library.
 */
export function transformI18nUsage() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		//Verify that the i18n variable is free to use in this module, if not generate a variation on it that is.
		verifyVarIsAvailableVisitor.initialize();
		visit(fileMetadata.ast, verifyVarIsAvailableVisitor);
		var freeI18NVariation = verifyVarIsAvailableVisitor.getFreeVariation('i18n');

		//Convert all requires with a certain ID to another ID and variable identifer.
		var moduleIdsToConvert = new Map([['ct', ['br/I18n', freeI18NVariation]]]);
		moduleIdVisitor.initialize(moduleIdsToConvert);
		visit(fileMetadata.ast, moduleIdVisitor);

		//Replace all calls to a certain namespace with calls to the new i18n identifier.
		flattenMemberExpression.initialize(['ct', 'i18n'], freeI18NVariation);
		visit(fileMetadata.ast, flattenMemberExpression);

		this.push(fileMetadata);
		callback();
	});
}

/**
 * This transform replaces non standard library includes with standard CJS module requires.
 *
 * @param {Set<string>} libraryIncludesToRequire - The library includes to replace with requires when found.
 * @param {Iterable<string>} libraryIncludeIterable - A sequence of names that correspond to a library include.
 * @returns {Function} Stream transform implementation which replaces library includes with module requires.
 */
export function replaceLibraryIncludesWithRequires(libraryIncludesToRequire, libraryIncludeIterable) {
	return through2.obj(function(fileMetadata, encoding, callback) {
		replaceLibraryIncludesWithRequiresVisitor.initialize(libraryIncludesToRequire, libraryIncludeIterable);
		transformASTAndPushToNextStream(fileMetadata, replaceLibraryIncludesWithRequiresVisitor, this, callback);
	});
}

/**
 * This transform adds 'use strict' as the first line of a module and removes any other instances.
 *
 * @returns {Function} Stream transform implementation which makes a module strict mode.
 */
export function addModuleUseStrict() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		transformASTAndPushToNextStream(fileMetadata, addModuleUseStrictVisitor, this, callback);
	});
}

/**
 * Parse AST and set it on the `contents` property of the FileMetadata argument passed into the transform.
 *
 * @returns {Function} Stream transform implementation which sets parsed AST on `contents` of FileMetadata.
 */
export function convertASTToBuffer() {
	return through2.obj(function(fileMetadata, encoding, callback) {
		var convertedCode = print(fileMetadata.ast, {wrapColumn: 200}).code;
		var convertedCodeBuffer = new Buffer(convertedCode);

		fileMetadata.contents = convertedCodeBuffer;
		this.push(fileMetadata);
		callback();
	});
}
