

/**
 * Create a visitor that will remove `globalizeSourceModules();`.
 *
 * @return {Visitor}
 */
"use strict";

exports.createRemoveGlobalizeSourceModulesCallVisitor = createRemoveGlobalizeSourceModulesCallVisitor;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var _utilsMatchers = require("./utils/matchers");

var callExpressionMatcher = _utilsMatchers.callExpressionMatcher;
var composeMatchers = _utilsMatchers.composeMatchers;
var identifierMatcher = _utilsMatchers.identifierMatcher;

var nodePathLocatorVisitor = require("./node-path-locator").nodePathLocatorVisitor;

var globalizeSourceModulesCallMatcher = composeMatchers(identifierMatcher("globalizeSourceModules"), callExpressionMatcher({ callee: identifierMatcher("globalizeSourceModules") }));

function matchedNodesReceiver(matchedNodePaths) {
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = (matchedNodePaths.get("Identifier") || [])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var matchedNodePath = _step.value;

			globalizeSourceModulesCallMatcher(matchedNodePath).prune();
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
}
function createRemoveGlobalizeSourceModulesCallVisitor() {
	var matcher = new Map();

	matcher.set("Identifier", globalizeSourceModulesCallMatcher);
	nodePathLocatorVisitor.initialize(matchedNodesReceiver, matcher);

	return nodePathLocatorVisitor;
}