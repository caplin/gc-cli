import {
	types
} from 'recast';

import {
	createRequireDeclaration,
	storeRequireCalls
} from './utils/utilities';

const {
	builders: {
		expressionStatement
	}
} = types;

/**
 * Add requires for any aliases found in the module strings. The requires are in the
 * `require(alias!found-alias)` form.
 */
export const addAliasesRequiresVisitor = {
	initialize(availableAliases) {
		this._aliasesInModule = new Set();
		this._availableAliases = availableAliases;
		this._preexistingRequiredModules = new Map();
	},

	/**
	 * @param {NodePath} callExpressionNodePath CallExpression NodePath
	 */
	visitCallExpression(callExpressionNodePath) {
		storeRequireCalls(callExpressionNodePath, this._preexistingRequiredModules);

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} literalNodePath - Literal NodePath.
	 */
	visitLiteral(literalNodePath) {
		const literalValue = literalNodePath.get('value').value;

		if (typeof literalValue === 'string') {
			for (const availableAlias of this._availableAliases) {
				if (literalValue.includes(availableAlias)) {
					this._aliasesInModule.add(availableAlias);
				}
			}
		}

		this.traverse(literalNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		const programStatements = programNodePath.get('body').value;

		for (const aliasInModule of this._aliasesInModule) {
			const moduleSource = `alias!${aliasInModule}`;
			const serviceRequire = `service!${aliasInModule}`;
			// The alias can already be required via an existing `alias!` or a `service!` require.
			const aliasAlreadyRequired = this._preexistingRequiredModules.has(moduleSource) ||
				this._preexistingRequiredModules.has(serviceRequire);

			if (aliasAlreadyRequired === false) {
				const requireCall = createRequireDeclaration(undefined, moduleSource);
				const requireExpressionStatement = expressionStatement(requireCall);

				programStatements.unshift(requireExpressionStatement);
			}
		}
	}
};
