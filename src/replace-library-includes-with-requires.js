const {Iterable} = require('immutable');
const {builders, namedTypes} = require('ast-types');

import {
	createRequireDeclaration,
	isNamespacedExpressionNode
} from './utils/utilities';

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * AstTypes NodePath.
 *
 * @typedef {Object} NodePath
 * @property {AstNode} node - SpiderMonkey AST node.
 */

/**
 * Certain library systems have non standard ways of including dependencies.
 * This transform aims to identify and replace them with a standard `require`.
 * The only requires added will be ones that are present in the code and in the `moduleIDsToRequire` `Set`.
 */
export const replaceLibraryIncludesWithRequiresVisitor = {
	/**
	 * @param {Set<string>} moduleIDsToRequire - The module IDs to require if included by non standard means.
	 * @param {Iterable<string>} libraryIncludeIterable - A Iterable of names that correspond to a library include.
	 */
	initialize(moduleIDsToRequire, libraryIncludeIterable) {
		this._libraryIncludesInModule = new Map();
		this._moduleIDsRequiredInModule = new Set();
		this._moduleIDsToRequire = moduleIDsToRequire;
		this._libraryIncludeIterable = libraryIncludeIterable.reverse();
	},

	/**
	 * @param {NodePath} callExpressionNodePath - CallExpression NodePath.
	 */
	visitCallExpression(callExpressionNodePath) {
		if (isRequire(callExpressionNodePath)) {
			const requireArgument = callExpressionNodePath.get('arguments', 0, 'value');
			this._moduleIDsRequiredInModule.add(requireArgument.value);
		} else if (isALibraryInclude(callExpressionNodePath, this._libraryIncludeIterable)) {
			const requireArgument = callExpressionNodePath.get('arguments', 0, 'value');
			this._libraryIncludesInModule.set(callExpressionNodePath, requireArgument.value);
		}

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		for (let [callExpressionNodePath, libraryIncludeID] of this._libraryIncludesInModule) {
			if (this._moduleIDsRequiredInModule.has(libraryIncludeID)) {
				callExpressionNodePath.parent.replace();
			} else if (this._moduleIDsToRequire.has(libraryIncludeID)) {
				const libraryRequire = createRequireDeclaration(undefined, libraryIncludeID);
				callExpressionNodePath.replace(libraryRequire);
				this._moduleIDsRequiredInModule.add(libraryIncludeID);

				console.log(`Replacing library include for ${libraryIncludeID} with a require`);
			} else {
				console.log(`*** Library include for ${libraryIncludeID} has not been replaced with a require ***`);
			}
		}
	}
};

/**
 * Checks if the given Node Path is a require CallExpression.
 *
 * @param {NodePath} callExpression - CallExpression NodePath.
 * @returns {boolean} true if the call expression is a module require.
 */
function isRequire(callExpression) {
	const callee = callExpression.get('callee');
	const isRequireCall = callee.node.name === 'require';
	const isStandaloneRequireCall = namedTypes.Identifier.check(callee.node);

	return isRequireCall && isStandaloneRequireCall;
}

/**
 * Checks if the given Node Path is a library include CallExpression.
 *
 * @param {NodePath} callExpression - CallExpression NodePath.
 * @param {Iterable<string>} libraryIncludeIterable - A Iterable of names that correspond to a library include.
 * @returns {boolean} true if the call expression is a library include.
 */
function isALibraryInclude(callExpression, libraryIncludeIterable) {
	const callee = callExpression.get('callee');

	return isNamespacedExpressionNode(callee.node, libraryIncludeIterable);
}
