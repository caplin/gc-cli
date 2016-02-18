import {
	callExpressionMatcher,
	composeMatchers,
	identifierMatcher
} from "./utils/matchers";
import {nodePathLocatorVisitor} from "./node-path-locator";

const globalizeSourceModulesCallMatcher = composeMatchers(
	identifierMatcher('globalizeSourceModules'),
	callExpressionMatcher({callee: identifierMatcher('globalizeSourceModules')})
);

function matchedNodesReceiver(matchedNodePaths) {
	for (let matchedNodePath of (matchedNodePaths.get('Identifier') || [])) {
		globalizeSourceModulesCallMatcher(matchedNodePath).prune();
	}
}

/**
 * Create a visitor that will remove `globalizeSourceModules();`.
 *
 * @return {Visitor}
 */
export function createRemoveGlobalizeSourceModulesCallVisitor() {
	const matcher = new Map();

	matcher.set('Identifier', globalizeSourceModulesCallMatcher);
	nodePathLocatorVisitor.initialize(matchedNodesReceiver, matcher);

	return nodePathLocatorVisitor;
}
