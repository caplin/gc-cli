/* eslint-disable no-param-reassign */

import {types} from 'recast';
import {info} from 'winston';

const {builders: {identifier, memberExpression}} = types;

/**
 * Transform that searches for use of the `EventHub` API and adds the last argument to its calls. As part of the move
 * to CJS from namespaced code we can no longer rely on string matches for discovering modules to bundle. So we have to
 * pass in the interface that the `EventHub` uses explictly so a `require` is added as part of the conversion.
 */
export const addInterfaceArgumentToEventHubVisitor = {

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		const {
			callArgs,
			interfaceClass,
			looksLikeEventHubCall
		} = getEventHubCallDetails(identifierNodePath);

		if (looksLikeEventHubCall) {
			info(`Adding EventHub call argument ${interfaceClass}`);

			const namespaceParts = interfaceClass
				.split('.')
				.map((namespacePart) => identifier(namespacePart));
			const {interfaceMemberExpression} = namespaceParts.reduce(createInterfaceMemberExpression, {});

			callArgs.push(interfaceMemberExpression);
		}

		this.traverse(identifierNodePath);
	}
};

// Creates the interface `MemberExpression`, i.e. `my.class.ClassName`.
function createInterfaceMemberExpression({object, property, interfaceMemberExpression}, namespacePart) {
	if (object === undefined) {
		object = namespacePart;
	} else if (property === undefined) {
		property = namespacePart;
		interfaceMemberExpression = memberExpression(object, property);
	} else {
		property = namespacePart;
		interfaceMemberExpression = memberExpression(interfaceMemberExpression, property);
	}

	return {
		object,
		property,
		interfaceMemberExpression
	};
}

/**
 * If this identifier is part of an `EventHub` `CallExpression` return the interface class and call expression
 * args list.
 *
 * @param  {NodePath}  identifierNodePath
 * @return {{callArgs: ASTNode[], interfaceClass: string}}
 */
function getEventHubCallDetails(identifierNodePath) {
	const methodName = identifierNodePath.get('name').value;

	if (methodName === 'getProxy' || methodName === 'subscribe') {
		const parent = identifierNodePath.parent.node;
		const grandParent = identifierNodePath.parent.parent.node;
		// Usually `eventService.getProxy\subscribe` or `.getService('caplin.event-service').getProxy\subscribe`.
		const inCallExpression = parent.type === 'MemberExpression' && grandParent.type === 'CallExpression';

		if (inCallExpression) {
			const callArgs = grandParent.arguments;
			const isGetProxyShape = callArgs.length === 2 && methodName === 'getProxy';
			const isSubscribeShape = callArgs.length === 3 && methodName === 'subscribe';
			const [interfaceArg, eventGroupArg] = callArgs;
			const areArgsLiterals = interfaceArg.type === 'Literal' && eventGroupArg.type === 'Literal';
			const areArgsStrings = typeof interfaceArg.value === 'string' && typeof eventGroupArg.value === 'string';

			return {
				callArgs,
				interfaceClass: interfaceArg.value,
				looksLikeEventHubCall: (isGetProxyShape || isSubscribeShape) && areArgsLiterals && areArgsStrings
			};
		}
	}

	return {};
}
