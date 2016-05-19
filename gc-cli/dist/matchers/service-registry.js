import { composeMatchers, identifierMatcher, callExpressionMatcher, memberExpressionMatcher } from '../../../global-compiler';

// Matches caplin.core.ServiceRegistry.getService('service')
const getServiceMatcher = composeMatchers(identifierMatcher('caplin'), memberExpressionMatcher({ property: identifierMatcher('core') }), memberExpressionMatcher({ property: identifierMatcher('ServiceRegistry') }), memberExpressionMatcher({ property: identifierMatcher('getService') }), callExpressionMatcher());

// Map<string, Function> matchers to test NodePaths against
export const getServiceMatchers = new Map();

getServiceMatchers.set('Identifier', getServiceMatcher);