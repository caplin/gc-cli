// Matcher exports
export {
	orMatchers,
	literalMatcher,
	composeMatchers,
	identifierMatcher,
	callExpressionMatcher,
	memberExpressionMatcher,
	variableDeclaratorMatcher
} from './utils/matchers';

// Transformer exports
export {
	extractParent,
	extractProperties,
	composeTransformers
} from './utils/transformers';

// Visitor exports
export {rootNamespaceVisitor} from './rootnstocjs';
export {moduleIdVisitor} from './module-id-converter';
export {nodePathLocatorVisitor} from './node-path-locator';
export {wrapModuleInIIFEVisitor} from './wrap-module-in-iife';
export {cjsRequireRemoverVisitor} from './cjs-require-remover';
export {iifeClassFlattenerVisitor} from './iife-class-flattener';
export {flattenProgramIIFEVisitor} from './flatten-program-iife';
export {flattenMemberExpression} from './flatten-member-expression';
export {verifyVarIsAvailableVisitor} from './verify-var-is-available';
export {namespacedClassFlattenerVisitor} from './namespaced-class-flattener';
export {varNamespaceAliasExpanderVisitor} from './var-namespace-alias-expander';
export {addRequireForGlobalIdentifierVisitor} from './add-require-for-global-identifier';
export {replaceLibraryIncludesWithRequiresVisitor} from './replace-library-includes-with-requires';
