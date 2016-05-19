import { assignmentExpressionMatcher, composeMatchers, identifierMatcher, memberExpressionMatcher } from './utils/matchers';
import { nodePathLocatorVisitor } from './node-path-locator';

/**
 * Create a function that receives any matched `NodePath`s and removes them from the AST.
 *
 * @param  {Function} classNameClassExportMatcher
 * @return {Function}
 */
function createMatchedNodesReceiver(classNameClassExportMatcher) {
	return matchedNodePaths => {
		for (let matchedNodePath of matchedNodePaths.get('MemberExpression') || []) {
			classNameClassExportMatcher(matchedNodePath).prune();
		}
	};
}

/**
 * Creates a matcher that matches on class name class export statements for the provided class namespace.
 *
 * @param  {Array<String>} classNamespaceParts
 * @return {Function}
 */
function createClassNameClassExportMatcher(classNamespaceParts) {
	const className = classNamespaceParts.pop();
	// The `MyClass` in `my.name.space.MyClass`.
	const classNameMatcher = memberExpressionMatcher({
		property: identifierMatcher(className)
	});
	const matcherParts = [];
	// The `my.name` in `my.name.space.MyClass`.
	const namespaceRootMatcher = memberExpressionMatcher({
		object: identifierMatcher(classNamespaceParts.shift()),
		property: identifierMatcher(classNamespaceParts.shift())
	});
	// The right hand side of the `my.name.space.MyClass = MyClass` assignment.
	const rightHandSideOfAssignmentMatcher = assignmentExpressionMatcher({
		right: identifierMatcher(className)
	});

	matcherParts.push(namespaceRootMatcher);

	// The middle part of the namespace `my.name.space.MyClass`, i.e `space`.
	const namespaceMiddleMatchers = classNamespaceParts.map(classNamespacePart => {
		return memberExpressionMatcher({
			property: identifierMatcher(classNamespacePart)
		});
	});

	matcherParts.push(...namespaceMiddleMatchers);
	matcherParts.push(classNameMatcher);
	matcherParts.push(rightHandSideOfAssignmentMatcher);

	return composeMatchers(...matcherParts);
}

/**
 * Create a visitor that will remove class name class exports of the form `my.class.MyClass = MyClass`.
 *
 * @param  {String} classNamespace
 * @return {Visitor}
 */
export function createRemoveClassNameClassExportVisitor(classNamespace) {
	const classNamespaceParts = classNamespace.split('.');
	const classNameClassExportMatcher = createClassNameClassExportMatcher(classNamespaceParts);
	const matchedNodesReceiver = createMatchedNodesReceiver(classNameClassExportMatcher);
	const matcher = new Map();

	matcher.set('MemberExpression', classNameClassExportMatcher);
	nodePathLocatorVisitor.initialize(matchedNodesReceiver, matcher);

	return nodePathLocatorVisitor;
}