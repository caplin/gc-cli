const {builders} = require('recast').types;

import {
	extractParent,
	extractProperties,
	composeTransformers
} from 'global-compiler';

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
		extractParent(),
		extractParent(),
		extractParent(),
		identifier('require'),
		extractParent(),
		extractProperties('arguments', 0),
		literal('service!' + serviceAlias)
	);
}
