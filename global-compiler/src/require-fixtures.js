import {types} from 'recast';

import {createRequireDeclaration} from './utils/utilities';

const fixturesCalls = new Set();
const {builders: {identifier}, namedTypes: {Literal, Identifier}} = types;

/**
 * Finds any `fixtures` calls and adds `require` statements for them.
 */
export const requireFixturesVisitor = {

	/**
	 * @param {NodePath} callExpressionNodePath - VariableDeclaration NodePath.
	 */
	visitCallExpression(callExpressionNodePath) {
		storeFixturesCalls(callExpressionNodePath);

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		const programStatements = programNodePath.get('body').value;

		for (let fixturesCall of fixturesCalls) {
			const fixture = fixturesCall.node.arguments[0].value;
			const moduleSource = fixture.replace(/\./g, '/');
			const moduleIdentifier = identifier(fixture.split('.').pop());
			const importDeclaration = createRequireDeclaration(moduleIdentifier, moduleSource);

			// Replace the call string value with the required module identifier.
			fixturesCall.node.arguments[0] = moduleIdentifier;
			programStatements.unshift(importDeclaration);
		}

		fixturesCalls.clear();
	}
};

function storeFixturesCalls(callExpressionNodePath) {
	const callArgs = callExpressionNodePath.node.arguments;
	const callArg = callArgs[0];
	const argsAreOK = callArgs.length === 1 && Literal.check(callArg) && typeof callArg.value === 'string';
	const calleeNode = callExpressionNodePath.node.callee;
	const isFixturesCall = Identifier.check(calleeNode) && calleeNode.name === 'fixtures';

	if (isFixturesCall && argsAreOK) {
		fixturesCalls.add(callExpressionNodePath);
	}
}
