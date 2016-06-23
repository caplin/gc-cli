import {
	types
} from 'recast';

import {createRequireDeclaration} from './utils/utilities';

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
			const requireCall = createRequireDeclaration(undefined, moduleSource);
			const requireExpressionStatement = expressionStatement(requireCall);

			programStatements.unshift(requireExpressionStatement);
		}
	}
};
