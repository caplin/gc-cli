import {types} from 'recast';

const {namedTypes: {Literal, Identifier, ExpressionStatement, MemberExpression, VariableDeclarator}} = types;

/**
 * Removes redundant requires from modules, e.g. requires that don't bind a module variable if there is a
 * require for the same module that does bind one.
 */
export const removeRedundantRequiresVisitor = {
	initialize() {
		this._moduleRequires = new Map();
	},

	/**
	 * @param {NodePath} callExpressionNodePath - VariableDeclaration NodePath.
	 */
	visitCallExpression(callExpressionNodePath) {
		storeRequireCalls(callExpressionNodePath, this._moduleRequires);

		this.traverse(callExpressionNodePath);
	},

	/**
	 * @param {NodePath} programNodePath - Program NodePath.
	 */
	visitProgram(programNodePath) {
		this.traverse(programNodePath);

		sortRequiresAndPruneRedundantRequires(this._moduleRequires);
	}
};

/**
 * Checks if the given Node Path is a require statement.
 *
 * @param {NodePath} callExpressionNodePath - CallExpressionNodePath NodePath.
 * @returns {boolean}
 */
function isARequire(callExpressionNodePath) {
	const args = callExpressionNodePath.get('arguments').value;
	const argumentsAreOK = args.length === 1 && Literal.check(args[0]);
	const callee = callExpressionNodePath.get('callee');
	const calleeIsOK = callee.node.name === 'require' && Identifier.check(callee.node);

	return argumentsAreOK && calleeIsOK;
}

/**
 * Gets a module's source
 *
 * @param  {NodePath} callExpressionNodePath
 * @return {string}
 */
function getModuleSource(callExpressionNodePath) {
	const args = callExpressionNodePath.get('arguments').value;

	return args[0].value;
}

/**
 * If the call expression is a `require` expression store the NodePath.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Map<string, Array<NodePath>>} moduleRequires
 */
function storeRequireCalls(callExpressionNodePath, moduleRequires) {
	if (isARequire(callExpressionNodePath)) {
		const moduleSource = getModuleSource(callExpressionNodePath);
		const moduleSourceRequires = moduleRequires.get(moduleSource) || [];

		moduleSourceRequires.push(callExpressionNodePath);
		moduleRequires.set(moduleSource, moduleSourceRequires);
	}
}

/**
 * Get a require call's import specifier (what the require imports).
 *
 * @param  {NodePath} requireCallExpressionNodePath
 * @return {string}
 */
function getImportSpecifier(requireCallExpressionNodePath) {
	const parentNode = requireCallExpressionNodePath.parentPath.node;

	if (ExpressionStatement.check(parentNode)) {
		// A stand alone require, default import e.g. `require('mylib')`.
		return 'default';
	}

	if (MemberExpression.check(parentNode)) {
		// A named import e.g. `require('mylib').namedImport`.
		return parentNode.property.name;
	}

	if (VariableDeclarator.check(parentNode)) {
		// Default import that's bound to a variable e.g. `var lib = require('mylib')`.
		return 'default';
	}
}

/**
 * Get a require call's local binding (what the required value is bound to in the module).
 *
 * @param  {NodePath} requireCallExpressionNodePath
 * @return {string}
 */
function getModuleLocalImportBinding(requireCallExpressionNodePath) {
	const parentNode = requireCallExpressionNodePath.parentPath.node;

	if (ExpressionStatement.check(parentNode)) {
		// A stand alone require with no local binding, default import e.g. `require('mylib')`.
		return '';
	}

	if (MemberExpression.check(parentNode)) {
		// A named import binding to a variable e.g. `var binding = require('mylib').namedImport`.
		return requireCallExpressionNodePath.parentPath.parentPath.node.id.name;
	}

	if (VariableDeclarator.check(parentNode)) {
		// Default import that's bound to a variable e.g. `var lib = require('mylib')`.
		return parentNode.id.name;
	}
}

/**
 * Given a map of all requires for a specific module source i.e. `mylib` in `var binding = require('mylib')` remove
 * any redundant requires, e.g. default unbound requires are pointless if there is another require for that module
 * source present. `require('mylib')` can be pruned if `var binding = require('mylib')` exists.
 *
 * @param  {Map<string, Array<NodePath>>} requireMetadataToRequireNodePaths
 */
function pruneRedundantRequires(requireMetadataToRequireNodePaths) {
	const moduleRequiresWithNoBindings = requireMetadataToRequireNodePaths.get('default');

	if (requireMetadataToRequireNodePaths.size > 1 && moduleRequiresWithNoBindings) {
		for (let unboundRequire of moduleRequiresWithNoBindings) {
			unboundRequire.prune();
		}
	}
}

/**
 * Given a require call calculate the require's metadata and store it keyed by its metadata.
 *
 * @param  {NodePath} callExpressionNodePath
 * @param  {Map<string, Array<NodePath>>} requireMetadataToRequireNodePaths
 */
function groupModuleSourceRequires(callExpressionNodePath, requireMetadataToRequireNodePaths) {
	const importSpecifier = getImportSpecifier(callExpressionNodePath);
	const moduleLocalImportBinding = getModuleLocalImportBinding(callExpressionNodePath);
	const requireMetadata = importSpecifier + moduleLocalImportBinding;
	const callExpressionsForSpecificRequire = requireMetadataToRequireNodePaths.get(requireMetadata) || [];

	callExpressionsForSpecificRequire.push(callExpressionNodePath);
	requireMetadataToRequireNodePaths.set(requireMetadata, callExpressionsForSpecificRequire);
}

/**
 * Sort a module source's requires and remove any redundant ones.
 *
 * @param  {Map<NodePath>} moduleRequires
 */
function sortRequiresAndPruneRedundantRequires(moduleRequires) {
	// For all the requires for a specific module source.
	for (let callExpressionNodePaths of moduleRequires.values()) {
		const requireMetadataToRequireNodePaths = new Map();

		// Group the requires by their metadata.
		for (let callExpressionNodePath of callExpressionNodePaths) {
			groupModuleSourceRequires(callExpressionNodePath, requireMetadataToRequireNodePaths);
		}

		// Remove any requires for a module source that are superfluous.
		pruneRedundantRequires(requireMetadataToRequireNodePaths);
	}
}
