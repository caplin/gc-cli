"use strict";

exports.namespacedClassVisitor = require("./flatten").namespacedClassVisitor;
exports.rootNamespaceVisitor = require("./rootnstocjs").rootNamespaceVisitor;
exports.moduleIdVisitor = require("./module-id-converter").moduleIdVisitor;
exports.namespacedIIFEClassVisitor = require("./iife-flatten").namespacedIIFEClassVisitor;
exports.nodePathLocatorVisitor = require("./node-path-locator").nodePathLocatorVisitor;
exports.wrapModuleInIIFEVisitor = require("./wrap-module-in-iife").wrapModuleInIIFEVisitor;
exports.cjsRequireRemoverVisitor = require("./cjs-require-remover").cjsRequireRemoverVisitor;
exports.flattenProgramIIFEVisitor = require("./flatten-program-iife").flattenProgramIIFEVisitor;
exports.addModuleUseStrictVisitor = require("./add-module-use-strict").addModuleUseStrictVisitor;
exports.flattenMemberExpression = require("./flatten-member-expression").flattenMemberExpression;
exports.verifyVarIsAvailableVisitor = require("./verify-var-is-available").verifyVarIsAvailableVisitor;
exports.varNamespaceAliasExpanderVisitor = require("./var-namespace-alias-expander").varNamespaceAliasExpanderVisitor;
exports.addRequireForGlobalIdentifierVisitor = require("./add-require-for-global-identifier").addRequireForGlobalIdentifierVisitor;
exports.replaceLibraryIncludesWithRequiresVisitor = require("./replace-library-includes-with-requires").replaceLibraryIncludesWithRequiresVisitor;
Object.defineProperty(exports, "__esModule", {
  value: true
});
