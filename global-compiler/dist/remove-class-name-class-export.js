"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

/**
 * Create a visitor that will remove class name class exports of the form `my.class.MyClass = MyClass`.
 *
 * @param  {String} classNamespace
 * @return {Visitor}
 */
exports.createRemoveClassNameClassExportVisitor = createRemoveClassNameClassExportVisitor;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var _utilsMatchers = require("./utils/matchers");

var assignmentExpressionMatcher = _utilsMatchers.assignmentExpressionMatcher;
var composeMatchers = _utilsMatchers.composeMatchers;
var identifierMatcher = _utilsMatchers.identifierMatcher;
var memberExpressionMatcher = _utilsMatchers.memberExpressionMatcher;

var nodePathLocatorVisitor = require("./node-path-locator").nodePathLocatorVisitor;

/**
 * Create a function that receives any matched `NodePath`s and removes them from the AST.
 *
 * @param  {Function} classNameClassExportMatcher
 * @return {Function}
 */
function createMatchedNodesReceiver(classNameClassExportMatcher) {
	return function (matchedNodePaths) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = (matchedNodePaths.get("MemberExpression") || [])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var matchedNodePath = _step.value;

				classNameClassExportMatcher(matchedNodePath).prune();
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator["return"]) {
					_iterator["return"]();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
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
	var className = classNamespaceParts.pop();
	// The `MyClass` in `my.name.space.MyClass`.
	var classNameMatcher = memberExpressionMatcher({
		property: identifierMatcher(className)
	});
	var matcherParts = [];
	// The `my.name` in `my.name.space.MyClass`.
	var namespaceRootMatcher = memberExpressionMatcher({
		object: identifierMatcher(classNamespaceParts.shift()),
		property: identifierMatcher(classNamespaceParts.shift()) });
	// The right hand side of the `my.name.space.MyClass = MyClass` assignment.
	var rightHandSideOfAssignmentMatcher = assignmentExpressionMatcher({
		right: identifierMatcher(className)
	});

	matcherParts.push(namespaceRootMatcher);

	// The middle part of the namespace `my.name.space.MyClass`, i.e `space`.
	var namespaceMiddleMatchers = classNamespaceParts.map(function (classNamespacePart) {
		return memberExpressionMatcher({
			property: identifierMatcher(classNamespacePart)
		});
	});

	matcherParts.push.apply(matcherParts, _toConsumableArray(namespaceMiddleMatchers));
	matcherParts.push(classNameMatcher);
	matcherParts.push(rightHandSideOfAssignmentMatcher);

	return composeMatchers.apply(undefined, matcherParts);
}
function createRemoveClassNameClassExportVisitor(classNamespace) {
	var classNamespaceParts = classNamespace.split(".");
	var classNameClassExportMatcher = createClassNameClassExportMatcher(classNamespaceParts);
	var matchedNodesReceiver = createMatchedNodesReceiver(classNameClassExportMatcher);
	var matcher = new Map();

	matcher.set("MemberExpression", classNameClassExportMatcher);
	nodePathLocatorVisitor.initialize(matchedNodesReceiver, matcher);

	return nodePathLocatorVisitor;
}