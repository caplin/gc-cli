"use strict";

exports.getServiceNodesReceiver = getServiceNodesReceiver;

var getServiceTransformer = require("../transformers/service-registry").getServiceTransformer;

function getServiceNodesReceiver(matchedNodePaths) {
	var getServiceExpressions = matchedNodePaths.get("Identifier") || [];

	getServiceExpressions.forEach(function (identifierNodePath) {
		// Get the service Literal NodePath - the service alias
		var serviceLiteral = identifierNodePath.parent.parent.parent.parent.get("arguments", 0);
		// Create a transformer to replace the getService call with a `require(service!)`
		var serviceTransformer = getServiceTransformer(serviceLiteral.value.value);

		serviceTransformer(identifierNodePath);
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});