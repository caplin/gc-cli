"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _globalCompiler = require("../../../global-compiler");

var composeMatchers = _globalCompiler.composeMatchers;
var identifierMatcher = _globalCompiler.identifierMatcher;
var callExpressionMatcher = _globalCompiler.callExpressionMatcher;
var memberExpressionMatcher = _globalCompiler.memberExpressionMatcher;

// Matches caplin.core.ServiceRegistry.getService('service')
var getServiceMatcher = composeMatchers(identifierMatcher("caplin"), memberExpressionMatcher({ property: identifierMatcher("core") }), memberExpressionMatcher({ property: identifierMatcher("ServiceRegistry") }), memberExpressionMatcher({ property: identifierMatcher("getService") }), callExpressionMatcher());

// Map<string, Function> matchers to test NodePaths against
var getServiceMatchers = new Map();

exports.getServiceMatchers = getServiceMatchers;
getServiceMatchers.set("Identifier", getServiceMatcher);