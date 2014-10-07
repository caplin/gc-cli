var builders = require('ast-types').builders;
var namedTypes = require('ast-types').namedTypes;

import {createRequireDeclaration} from './utils/utilities';

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
 * This transform adds CJS requires for specified global identifiers.
 */
export var addRequireForGlobalIdentifierVisitor = {
	/**
	 * @param {Map<Sequence<string>, string>} identifiersToRequire - The identifiers that should be required.
	 * @param {AstNode[]} programStatements - Program body statements.
	 */
	initialize(identifiersToRequire, programStatements) {
		this._matchedGlobalIdentifiers = new Map();
		this._programStatements = programStatements;
		this._identifiersToRequire = identifiersToRequire;
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		for (var [identifierSequence, libraryID] of this._identifiersToRequire) {
			if (isIdentifierToRequire(identifierNodePath, identifierSequence)) {
				this._matchedGlobalIdentifiers.set(identifierNodePath, identifierSequence);
			}
		}

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		addRequiresForGlobalIdentifiers(this._matchedGlobalIdentifiers, this._identifiersToRequire, this._programStatements);
	}
}

/**
 * Checks if identifier is an identifier to create a require for.
 *
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @param {Sequence<string>} identifierSequence - The identifier sequence to check.
 * @returns {boolean} true if identifier should be required.
 */
function isIdentifierToRequire(identifierNodePath, identifierSequence) {
	var isPartOfIdentifierToRequire = (identifierNodePath.node.name === identifierSequence.last());

	if (isPartOfIdentifierToRequire && identifierSequence.count() > 1) {
		var [nextNodePathInSequence, remainingSequence] = getNextNodePath(identifierNodePath, identifierSequence);

		if (nextNodePathInSequence) {
			return isIdentifierToRequire(nextNodePathInSequence, remainingSequence);
		}
	} else if (isPartOfIdentifierToRequire) {
		return isStandaloneIdentifier(identifierNodePath);
	}

	return false;
}

/**
 * Returns the next NodePath to check against a sequence if there is one that matches the values
 * in the Sequence.
 *
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @param {Sequence<string>} identifierSequence - The identifier sequence to check.
 * @returns {([NodePath, Sequence<string>]|undefined)} Next NodePath to check.
 */
function getNextNodePath(identifierNodePath, identifierSequence) {
	var remainingSequence = identifierSequence.butLast();
	var identifierParentNodePath = identifierNodePath.parent;

	if (namedTypes.MemberExpression.check(identifierParentNodePath.node)) {
		var object = identifierParentNodePath.get('object');

		if (namedTypes.CallExpression.check(object.node) && remainingSequence.last() === '()') {
			return [object.get('callee'), remainingSequence.butLast()];
		}

		return [object, remainingSequence];
	}
}

/**
 * We don't want to match an identifier if by concidence it's part of a larger expression.
 * i.e. my.expression.jQuery.shouldnt.match.
 *
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @returns {boolean} true if identifier is the root of an expression.
 */
function isStandaloneIdentifier(identifierNodePath) {
	var identifierParentNodePath = identifierNodePath.parent;

	if (namedTypes.CallExpression.check(identifierParentNodePath.node)) {
		return true;
	}

	return false;
}

/**
 * Add any requires to the module head that are deemed to be required for the global identifiers in the module.
 *
 * @param {Map<AstNode, Sequence<string>>} matchedGlobalIdentifiers - The identifiers that should be required.
 * @param {Map<Sequence<string>, string>} identifiersToRequire - The identifiers that should be required.
 * @param {AstNode[]} programStatements - Program body statements.
 */
function addRequiresForGlobalIdentifiers(matchedGlobalIdentifiers, identifiersToRequire, programStatements) {
	var moduleIdentifiersToRequire = new Set(matchedGlobalIdentifiers.values());

	//TODO: You have a match on the longer and a match on the shorter of two libraries using the same identifiers.
	//The longer needs the shorter as it's a plugin so all you need to do is require the longer as it should
	//require the shorter itself. The require statement will have a variable with a name equals to the shorter.
	for (var sequenceToRequire of moduleIdentifiersToRequire) {
		var moduleID = identifiersToRequire.get(sequenceToRequire);
		var moduleIdentifier = builders.identifier(sequenceToRequire.first());
		var importDeclaration = createRequireDeclaration(moduleIdentifier, moduleID);

		console.log('Adding require for', moduleID, 'with variable name', sequenceToRequire.first());
		programStatements.unshift(importDeclaration);
	}
}
