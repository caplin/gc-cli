"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _require$types = require("recast").types;

var builders = _require$types.builders;
var namedTypes = _require$types.namedTypes;

var createRequireDeclaration = require("./utils/utilities").createRequireDeclaration;

/**
 * This transform adds CJS requires for specified global identifiers.
 */
var addRequireForGlobalIdentifierVisitor = {
	/**
  * @param {Map<Sequence<string>, string>} identifiersToRequire - The identifiers that should be required.
  * @param {AstNode[]} programStatements - Program body statements.
  */
	initialize: function initialize(identifiersToRequire, programStatements) {
		this._matchedGlobalIdentifiers = new Map();
		this._programStatements = programStatements;
		this._identifiersToRequire = identifiersToRequire;
	},

	/**
  * @param {NodePath} identifierNodePath - Identifier NodePath.
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = this._identifiersToRequire[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var _step$value = _slicedToArray(_step.value, 2);

				var identifierSequence = _step$value[0];
				var libraryID = _step$value[1];

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
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram: function visitProgram(programNodePath) {
		this.traverse(programNodePath);

		addRequiresForGlobalIdentifiers(this._matchedGlobalIdentifiers, this._identifiersToRequire, this._programStatements);
	}
};

exports.addRequireForGlobalIdentifierVisitor = addRequireForGlobalIdentifierVisitor;
/**
 * Checks if identifier is an identifier to create a require for.
 *
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @param {Sequence<string>} identifierSequence - The identifier sequence to check.
 * @returns {boolean} true if identifier should be required.
 */
function isIdentifierToRequire(_x, _x2) {
	var _again = true;

	_function: while (_again) {
		_again = false;
		var identifierNodePath = _x,
		    identifierSequence = _x2;
		isPartOfIdentifierToRequire = _getNextNodePath = _getNextNodePath2 = nextNodePathInSequence = remainingSequence = undefined;

		var isPartOfIdentifierToRequire = identifierNodePath.node.name === identifierSequence.last();

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
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @param {Sequence<string>} identifierSequence - The identifier sequence to check.
 * @returns {([NodePath, Sequence<string>]|undefined)} Next NodePath to check.
 */
function getNextNodePath(identifierNodePath, identifierSequence) {
	var remainingSequence = identifierSequence.butLast();
	var identifierParentNodePath = identifierNodePath.parent;

	if (namedTypes.MemberExpression.check(identifierParentNodePath.node)) {
		var object = identifierParentNodePath.get("object");

		if (namedTypes.CallExpression.check(object.node) && remainingSequence.last() === "()") {
			return [object.get("callee"), remainingSequence.butLast()];
		}

		return [object, remainingSequence];
	}
}

/**
 * We don't want to match an identifier if by coincidence it's part of a larger expression.
 * i.e. my.expression.jQuery.shouldnt.match.
 *
 * @param {NodePath} identifierNodePath - An identifier NodePath.
 * @returns {boolean} true if identifier is the root of an expression.
 */
function isStandaloneIdentifier(identifierNodePath) {
	var identifierParentNodePath = identifierNodePath.parent;

	if (namedTypes.CallExpression.check(identifierParentNodePath.node)) {
		return true;
	} else if (namedTypes.MemberExpression.check(identifierParentNodePath.node)) {
		return identifierParentNodePath.get("object") === identifierNodePath;
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
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = moduleIdentifiersToRequire[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var sequenceToRequire = _step.value;

			var moduleID = identifiersToRequire.get(sequenceToRequire);
			var moduleIdentifier = builders.identifier(sequenceToRequire.first());
			var importDeclaration = createRequireDeclaration(moduleIdentifier, moduleID);

			console.log("Adding require for", moduleID, "with variable name", sequenceToRequire.first());
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