/**
 * Returns a function that when provided with a NodePath will transform it according to
 * the operations of the provided transforms.
 *
 * @param   {...(NodePath|Function)} transforms - The list of NodePaths and transforms
 * that will be used to transform the provided NodePath.
 * @returns {Function} Function that will transform a provided NodePath.
 */
export function composeTransformers(...transforms) {
	return nodePath => {
		transforms.reduce((previousNodePath, transform) => {
			if (transform instanceof Function) {
				return transform(previousNodePath);
			} else {
				previousNodePath.replace(transform);
			}

			return previousNodePath;
		}, nodePath);
	}
}

/**
 * Returns a function that when provided with a NodePath will return it's parent.
 *
 * @returns {Function} Will return a NodePath's parent.
 */
export function parent() {
	return nodePath => nodePath.parent;
}

/**
 * Returns a function that when provided with a NodePath will extract the
 * requested child NodePath.
 *
 * @param   {(string|number)[]} ...properties Properties to extract.
 * @returns {Function}          Child NodePath extractor.
 */
export function extract(...properties) {
	return nodePath => nodePath.get(...properties);
}
