import {
	identifier,
	callExpression,
	composeMatchers,
	memberExpression,
} from 'global-compiler/utils/matchers';

// Matches caplin.core.ServiceRegistry.getService('service')
const getServiceMatcher = composeMatchers(
	identifier('caplin'),
	memberExpression({property: identifier('core')}),
	memberExpression({property: identifier('ServiceRegistry')}),
	memberExpression({property: identifier('getService')}),
	callExpression()
);

// Map<string, Function> matchers to test NodePaths against
const getServiceMatchers = new Map();

getServiceMatchers.set('Identifier', getServiceMatcher);

export getServiceMatchers;
