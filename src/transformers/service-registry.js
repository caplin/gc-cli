const {builders} = require('recast').types;

import {
	parent,
	extract,
	composeTransformers
} from 'global-compiler/utils/transformers';

const {literal, identifier} = builders;

/**
 * Creates a transformer that modifies `caplin.core.ServiceRegistry.getService` to
 * require('service!').
 *
 * @param   {String}   serviceAlias Service alias to require
 * @returns {Function} Transformer function
 */
export function getServiceTransformer(serviceAlias) {
	return composeTransformers(
		parent(),
		parent(),
		parent(),
		identifier('require'),
		parent(),
		extract('arguments', 0),
		literal('service!' + serviceAlias)
	);
}
