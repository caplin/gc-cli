"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
// Matcher exports

var _utilsMatchers = require("./utils/matchers");

exports.orMatchers = _utilsMatchers.orMatchers;
exports.literalMatcher = _utilsMatchers.literalMatcher;
exports.composeMatchers = _utilsMatchers.composeMatchers;
exports.identifierMatcher = _utilsMatchers.identifierMatcher;
exports.callExpressionMatcher = _utilsMatchers.callExpressionMatcher;
exports.memberExpressionMatcher = _utilsMatchers.memberExpressionMatcher;
exports.variableDeclaratorMatcher = _utilsMatchers.variableDeclaratorMatcher;

// Transformer exports

var _utilsTransformers = require("./utils/transformers");

exports.extractParent = _utilsTransformers.extractParent;
exports.extractProperties = _utilsTransformers.extractProperties;
exports.composeTransformers = _utilsTransformers.composeTransformers;

// Visitor exports
exports.rootNamespaceVisitor = require("./rootnstocjs").rootNamespaceVisitor;
exports.moduleIdVisitor = require("./module-id-converter").moduleIdVisitor;
exports.nodePathLocatorVisitor = require("./node-path-locator").nodePathLocatorVisitor;
exports.wrapModuleInIIFEVisitor = require("./wrap-module-in-iife").wrapModuleInIIFEVisitor;
exports.cjsRequireRemoverVisitor = require("./cjs-require-remover").cjsRequireRemoverVisitor;
exports.iifeClassFlattenerVisitor = require("./iife-class-flattener").iifeClassFlattenerVisitor;
exports.flattenProgramIIFEVisitor = require("./flatten-program-iife").flattenProgramIIFEVisitor;
exports.flattenMemberExpression = require("./flatten-member-expression").flattenMemberExpression;
exports.verifyVarIsAvailableVisitor = require("./verify-var-is-available").verifyVarIsAvailableVisitor;
exports.createRemoveClassNameClassExportVisitor = require("./remove-class-name-class-export").createRemoveClassNameClassExportVisitor;
exports.namespacedClassFlattenerVisitor = require("./namespaced-class-flattener").namespacedClassFlattenerVisitor;
exports.varNamespaceAliasExpanderVisitor = require("./var-namespace-alias-expander").varNamespaceAliasExpanderVisitor;
exports.addRequireForGlobalIdentifierVisitor = require("./add-require-for-global-identifier").addRequireForGlobalIdentifierVisitor;
exports.replaceLibraryIncludesWithRequiresVisitor = require("./replace-library-includes-with-requires").replaceLibraryIncludesWithRequiresVisitor;