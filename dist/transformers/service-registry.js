"use strict";

/**
 * Creates a transformer that modifies `caplin.core.ServiceRegistry.getService` to
 * require('service!').
 *
 * @param   {String}   serviceAlias Service alias to require
 * @returns {Function} Transformer function
 */
exports.getServiceTransformer = getServiceTransformer;
Object.defineProperty(exports, "__esModule", {
	value: true
});

var builders = require("recast").types.builders;

var _globalCompiler = require("global-compiler");

var extractParent = _globalCompiler.extractParent;
var extractProperties = _globalCompiler.extractProperties;
var composeTransformers = _globalCompiler.composeTransformers;
var literal = builders.literal;
var identifier = builders.identifier;

function getServiceTransformer(serviceAlias) {
	return composeTransformers(extractParent(), extractParent(), extractParent(), identifier("require"), extractParent(), extractProperties("arguments", 0), literal("service!" + serviceAlias));
}