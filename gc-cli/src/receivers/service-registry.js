import {getServiceTransformer} from '../transformers/service-registry'

export function getServiceNodesReceiver(matchedNodePaths) {
	const getServiceExpressions = matchedNodePaths.get('Identifier') || [];

	getServiceExpressions.forEach((identifierNodePath) => {
		// Get the service Literal NodePath - the service alias
		const serviceLiteral = identifierNodePath.parent.parent.parent.parent.get('arguments', 0);
		// Create a transformer to replace the getService call with a `require(service!)`
		const serviceTransformer = getServiceTransformer(serviceLiteral.value.value);

		serviceTransformer(identifierNodePath);
	});
}
