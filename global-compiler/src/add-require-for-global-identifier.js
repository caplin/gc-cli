import {
	types
} from 'recast';

import {
	createRequireDeclaration
} from './utils/utilities';

const {
	builders: {
		identifier
	},
	namedTypes: {
		MemberExpression,
		CallExpression
	}
} = types;

/**
 * Store any preexisting import specifiers so the visitor doesn't add duplicates.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Set<string>} preexistingImportSpecifiers
 */
function storePreexistingImportSpecifier(callExpressionNodePath, preexistingImportSpecifiers) {
	const {name, type} = callExpressionNodePath.node.callee;
	const parentNode = callExpressionNodePath.parentPath.node;

	if (type === 'Identifier' && name === 'require' && parentNode.type === 'VariableDeclarator') {
		preexistingImportSpecifiers.add(parentNode.id.name);
	}
}

/**
 * We don't want an identifier to match if by coincidence it's part of a larger expression.
 * i.e. my.expression.jQuery.shouldnt.match. shouldn't match the jQuery library.
 *
 * @param   {NodePath} identifierNodePath An identifier NodePath
 * @returns {boolean}  true if identifier is the root of an expression
 */
function isStandaloneIdentifier(identifierNodePath) {
	const identifierParentNodePath = identifierNodePath.parent;

	if (CallExpression.check(identifierParentNodePath.node)) {
		return true;
	} else if (MemberExpression.check(identifierParentNodePath.node)) {
		return identifierParentNodePath.get('object') === identifierNodePath;
	}

	return false;
}

/**
 * Returns the next NodePath to check against a sequence if there is one that matches the values
 * in the Sequence.
 *
 * @param   {NodePath}                                 identifierNodePath An identifier NodePath
 * @param   {Sequence<string>}                         identifierSequence The identifier sequence to check
 * @returns {([NodePath, Sequence<string>]|undefined)} Next NodePath to check
 */
function getNextNodePath({parent: identifierParentNodePath}, identifierSequence) {
	const remainingSequence = identifierSequence.butLast();

	if (MemberExpression.check(identifierParentNodePath.node)) {
		const object = identifierParentNodePath.get('object');

		// If the library identifier sequence includes a call expression, denoted with '()'
		// then the next node path in sequence is the `callee` of the parent.
		if (CallExpression.check(object.node) && remainingSequence.last() === '()') {
			return [object.get('callee'), remainingSequence.butLast()];
		}

		return [object, remainingSequence];
	}

	return [];
}

/**
 * Checks if identifier is an identifier to create a require for.
 *
 * @param   {NodePath}         identifierNodePath An identifier NodePath
 * @param   {Sequence<string>} identifierSequence The identifier sequence to check
 * @returns {boolean}          true if identifier should be required
 */
function isIdentifierToRequire(identifierNodePath, identifierSequence) {
	const isPartOfIdentifierToRequire = identifierNodePath.node.name === identifierSequence.last();

	// We can have library identifiers require multiple namespace levels, such as moment().tz being
	// the use of the moment-timezone library. This usage should not be confused with moment usage.
	// The first branch is for libraries with multiple namespace levels.
	if (isPartOfIdentifierToRequire && identifierSequence.count() > 1) {
		const [nextNodePathInSequence, remainingSequence] = getNextNodePath(identifierNodePath, identifierSequence);

		if (nextNodePathInSequence) {
			return isIdentifierToRequire(nextNodePathInSequence, remainingSequence);
		}
	} else if (isPartOfIdentifierToRequire) {
		return isStandaloneIdentifier(identifierNodePath);
	}

	return false;
}

/**
 * Remove duplicate require sequences and sequences that match already imported module specifiers.
 *
 * @param  {Map<NodePath, Sequence<string>>} matchedGlobalIdentifiers
 * @param  {Set<string>} preexistingImportSpecifiers
 * @return {Set<Sequence<string>>}
 */
function filterSequences(matchedGlobalIdentifiers, preexistingImportSpecifiers) {
	// You can find a library identifier multiple times in a module, putting the identifier sequences
	// into a Set filters out duplicates.
	const moduleSpecifiersToRequire = new Set();

	for (const [, sequenceToRequire] of matchedGlobalIdentifiers) {
		const importSpecifierAlreadyPresent = preexistingImportSpecifiers.has(sequenceToRequire.first());

		// If an import specifier already exists for the library don't add another require for it.
		if (importSpecifierAlreadyPresent === false) {
			moduleSpecifiersToRequire.add(sequenceToRequire);
		}
	}

	return moduleSpecifiersToRequire;
}

/**
 * Add any requires to the module head that are deemed to be required for the global identifiers in the module.
 *
 * @param {Set<Sequence<string>>} sequencesToRequire The sequences that matched during the search
 * @param {Map<Sequence<string>, string>}  identifiersToRequire     All the identifiers that are searched for
 * @param {AstNode[]}                      programStatements        Program body statements
 */
function addRequiresForGlobalIdentifiers(sequencesToRequire, identifiersToRequire, programStatements) {
	// If you have a match on the longer and a match on the shorter of two libraries using the same identifiers.
	// The longer needs the shorter as it's a plugin so all you need to do is require the longer as it should
	// require the shorter itself. The require statement will have a variable with a name equals to the shorter.
	for (const sequenceToRequire of sequencesToRequire) {
		// 'sl4bdummy->SL4B_Accessor' allows the user to import `SL4B_Accessor` from `sl4bdummy`.
		const [moduleSource, importSpecifier] = identifiersToRequire.get(sequenceToRequire).split('->');
		const moduleIdentifier = identifier(sequenceToRequire.first());
		const importDeclaration = createRequireDeclaration(moduleIdentifier, moduleSource, importSpecifier);

		programStatements.unshift(importDeclaration);
	}
}

/**
 * This transform adds CJS requires for specified global identifiers. If one of the specified
 * identifiers is `jQuery` it can be configured to add the statement `var jQuery = require('jquery');`
 * to the top of the module.
 */
export const addRequireForGlobalIdentifierVisitor = {

	/**
	 * @param {Map<Sequence<string>, string>} identifiersToRequire The identifiers that should be required
	 */
	initialize(identifiersToRequire) {
		this._matchedGlobalIdentifiers = new Map();
		this._preexistingImportSpecifiers = new Set();
		this._identifiersToRequire = identifiersToRequire;
	},

	/**
	 * @param {NodePath} callExpressionNodePath CallExpression NodePath
	 */
	visitCallExpression(callExpressionNodePath) {
		storePreexistingImportSpecifier(callExpressionNodePath, this._preexistingImportSpecifiers);

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} identifierNodePath Identifier NodePath
	 */
	visitIdentifier(identifierNodePath) {
		for (const [identifierSequence] of this._identifiersToRequire) {
			if (isIdentifierToRequire(identifierNodePath, identifierSequence)) {
				this._matchedGlobalIdentifiers.set(identifierNodePath, identifierSequence);
			}
		}

		this.traverse(identifierNodePath);
	},

	/**
	 * @param {NodePath} programNodePath Program NodePath
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		const programStatements = programNodePath.get('body').value;
		const sequencesToRequire = filterSequences(this._matchedGlobalIdentifiers, this._preexistingImportSpecifiers);

		addRequiresForGlobalIdentifiers(sequencesToRequire, this._identifiersToRequire, programStatements);
	}
};
