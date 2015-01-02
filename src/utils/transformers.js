/**
 * Returns a function that when provided with a NodePath will return it's parent.
 * @returns {Function} Will return a NodePath's parent.
 */
export function parent() {
	return nodePath => nodePath.parent;
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
