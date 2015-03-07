"use strict";

var _globalCompiler = require("global-compiler");

var composeMatchers = _globalCompiler.composeMatchers;
var identifierMatcher = _globalCompiler.identifierMatcher;
var callExpressionMatcher = _globalCompiler.callExpressionMatcher;
var memberExpressionMatcher = _globalCompiler.memberExpressionMatcher;

// Matches caplin.core.ServiceRegistry.getService('service')
var getServiceMatcher = composeMatchers(identifierMatcher("caplin"), memberExpressionMatcher({ property: identifierMatcher("core") }), memberExpressionMatcher({ property: identifierMatcher("ServiceRegistry") }), memberExpressionMatcher({ property: identifierMatcher("getService") }), callExpressionMatcher());

// Map<string, Function> matchers to test NodePaths against
var getServiceMatchers = exports.getServiceMatchers = new Map();

getServiceMatchers.set("Identifier", getServiceMatcher);
Object.defineProperty(exports, "__esModule", {
	value: true
});