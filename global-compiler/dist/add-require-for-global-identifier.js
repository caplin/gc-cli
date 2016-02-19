"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var log = require("winston").log;

var types = require("recast").types;

var createRequireDeclaration = require("./utils/utilities").createRequireDeclaration;

var identifier = types.builders.identifier;
var _types$namedTypes = types.namedTypes;
var MemberExpression = _types$namedTypes.MemberExpression;
var CallExpression = _types$namedTypes.CallExpression;

/**
 * This transform adds CJS requires for specified global identifiers. If one of the specified
 * identifiers is `jQuery` it can be configured to add the statement `var jQuery = require('jquery');`
 * to the top of the module.
 */
var addRequireForGlobalIdentifierVisitor = {
	/**
  * @param {Map<Sequence<string>, string>} identifiersToRequire The identifiers that should be required
  */
	initialize: function initialize(identifiersToRequire) {
		this._matchedGlobalIdentifiers = new Map();
		this._preexistingImportSpecifiers = new Set();
		this._identifiersToRequire = identifiersToRequire;
	},

	/**
  * @param {NodePath} callExpressionNodePath CallExpression NodePath
  */
	visitCallExpression: function visitCallExpression(callExpressionNodePath) {
		storePreexistingImportSpecifier(callExpressionNodePath, this._preexistingImportSpecifiers);

		this.traverse(callExpressionNodePath);
	},

	/**
  * @param {NodePath} identifierNodePath Identifier NodePath
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = this._identifiersToRequire[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var _step$value = _slicedToArray(_step.value, 1);

				var identifierSequence = _step$value[0];

				if (isIdentifierToRequire(identifierNodePath, identifierSequence)) {
					this._matchedGlobalIdentifiers.set(identifierNodePath, identifierSequence);
				}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator["return"]) {
					_iterator["return"]();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		this.traverse(identifierNodePath);
	},

	/**
  * @param {NodePath} programNodePath Program NodePath
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		var programStatements = programNodePath.get("body").value;
		var sequencesToRequire = filterSequences(this._matchedGlobalIdentifiers, this._preexistingImportSpecifiers);

		addRequiresForGlobalIdentifiers(sequencesToRequire, this._identifiersToRequire, programStatements);
	}
};

exports.addRequireForGlobalIdentifierVisitor = addRequireForGlobalIdentifierVisitor;
/**
 * Store any preexisting import specifiers so the visitor doesn't add duplicates.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Set<string>} preexistingImportSpecifiers
 */
function storePreexistingImportSpecifier(callExpressionNodePath, preexistingImportSpecifiers) {
	var calleeNode = callExpressionNodePath.node.callee;
	var parentNode = callExpressionNodePath.parentPath.node;

	if (calleeNode.type === "Identifier" && calleeNode.name === "require" && parentNode.type === "VariableDeclarator") {
		preexistingImportSpecifiers.add(parentNode.id.name);
	}
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
	var moduleSpecifiersToRequire = new Set();

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = matchedGlobalIdentifiers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var _step$value = _slicedToArray(_step.value, 2);

			var sequenceToRequire = _step$value[1];

			var importSpecifierAlreadyPresent = preexistingImportSpecifiers.has(sequenceToRequire.first());

			// If an import specifier already exists for the library don't add another require for it.
			if (importSpecifierAlreadyPresent === false) {
				moduleSpecifiersToRequire.add(sequenceToRequire);
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator["return"]) {
				_iterator["return"]();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	return moduleSpecifiersToRequire;
}

/**
 * Checks if identifier is an identifier to create a require for.
 *
 * @param   {NodePath}         identifierNodePath An identifier NodePath
 * @param   {Sequence<string>} identifierSequence The identifier sequence to check
 * @returns {boolean}          true if identifier should be required
 */
function isIdentifierToRequire(_x, _x2) {
	var _again = true;

	_function: while (_again) {
		_again = false;
		var identifierNodePath = _x,
		    identifierSequence = _x2;
		isPartOfIdentifierToRequire = _getNextNodePath = _getNextNodePath2 = nextNodePathInSequence = remainingSequence = undefined;

		var isPartOfIdentifierToRequire = identifierNodePath.node.name === identifierSequence.last();

		// We can have library identifiers require multiple namespace levels, such as moment().tz being
		// the use of the moment-timezone library. This usage should not be confused with moment usage.
		// The first branch is for libraries with multiple namespace levels.
		if (isPartOfIdentifierToRequire && identifierSequence.count() > 1) {
			var _getNextNodePath = getNextNodePath(identifierNodePath, identifierSequence);

			var _getNextNodePath2 = _slicedToArray(_getNextNodePath, 2);

			var nextNodePathInSequence = _getNextNodePath2[0];
			var remainingSequence = _getNextNodePath2[1];

			if (nextNodePathInSequence) {
				_x = nextNodePathInSequence;
				_x2 = remainingSequence;
				_again = true;
				continue _function;
			}
		} else if (isPartOfIdentifierToRequire) {
			return isStandaloneIdentifier(identifierNodePath);
		}

		return false;
	}
}

/**
 * Returns the next NodePath to check against a sequence if there is one that matches the values
 * in the Sequence.
 *
 * @param   {NodePath}                                 identifierNodePath An identifier NodePath
 * @param   {Sequence<string>}                         identifierSequence The identifier sequence to check
 * @returns {([NodePath, Sequence<string>]|undefined)} Next NodePath to check
 */
function getNextNodePath(_ref, identifierSequence) {
	var identifierParentNodePath = _ref.parent;

	var remainingSequence = identifierSequence.butLast();

	if (MemberExpression.check(identifierParentNodePath.node)) {
		var object = identifierParentNodePath.get("object");

		// If the library identifier sequence includes a call expression, denoted with '()'
		// then the next node path in sequence is the `callee` of the parent.
		if (CallExpression.check(object.node) && remainingSequence.last() === "()") {
			return [object.get("callee"), remainingSequence.butLast()];
		}

		return [object, remainingSequence];
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
	var identifierParentNodePath = identifierNodePath.parent;

	if (CallExpression.check(identifierParentNodePath.node)) {
		return true;
	} else if (MemberExpression.check(identifierParentNodePath.node)) {
		return identifierParentNodePath.get("object") === identifierNodePath;
	}

	return false;
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
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = sequencesToRequire[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var sequenceToRequire = _step.value;

			var moduleID = identifiersToRequire.get(sequenceToRequire);
			var moduleIdentifier = identifier(sequenceToRequire.first());
			var importDeclaration = createRequireDeclaration(moduleIdentifier, moduleID);

			log("Adding require for " + moduleID + " with variable name " + sequenceToRequire.first());

			programStatements.unshift(importDeclaration);
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator["return"]) {
				_iterator["return"]();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}
}