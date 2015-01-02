
export function parent(nodePath) {
	return nodePath.parent;
}

/**
 * Returns a function that when provided with a NodePath will extract the
 * requested node property.
 *
 * @param {string} property - Property to extract.
 * @returns {Function} Property extractor.
 */
export function extract(property) {
	return nodePath => nodePath.get(property);
}
