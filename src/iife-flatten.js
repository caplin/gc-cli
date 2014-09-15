var Sequence = require('immutable').Sequence;

export var namespacedIIFEClassVisitor = {
	/**
	 * @param {string} fullyQualifiedName - The fully qualified class name.
	 */
	initialize(fullyQualifiedName) {
		this._namespaceSequence = Sequence(fullyQualifiedName.split('.').reverse());
		this._className = this._namespaceSequence.first();
	},

	/**
	 * @param {NodePath} identifierNodePath - Identifier NodePath.
	 */
	visitIdentifier(identifierNodePath) {
		this.traverse(identifierNodePath);
	}
}
