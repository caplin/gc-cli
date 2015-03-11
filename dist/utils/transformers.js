"use strict";

/**
 * Returns a function that when provided with a NodePath will transform it according to
 * the operations of the provided transforms.
 *
 * @param   {...(NodePath|Function)} transforms - The list of NodePaths and transforms
 * that will be used to transform the provided NodePath.
 * @returns {Function} Function that will transform a provided NodePath.
 */
exports.composeTransformers = composeTransformers;

/**
 * Returns a function that when provided with a NodePath will return it's parent.
 *
 * @returns {Function} Will return a NodePath's parent.
 */
exports.extractParent = extractParent;

/**
 * Returns a function that when provided with a NodePath will extract the
 * requested child NodePath.
 *
 * @param   {(string|number)[]} ...properties Properties to extract.
 * @returns {Function}          Child NodePath extractor.
 */
exports.extractProperties = extractProperties;
Object.defineProperty(exports, "__esModule", {
  value: true
});

function composeTransformers() {
  for (var _len = arguments.length, transforms = Array(_len), _key = 0; _key < _len; _key++) {
    transforms[_key] = arguments[_key];
  }

  return function (nodePath) {
    transforms.reduce(function (previousNodePath, transform) {
      if (transform instanceof Function) {
        return transform(previousNodePath);
      } else {
        previousNodePath.replace(transform);
      }

      return previousNodePath;
    }, nodePath);
  };
}

function extractParent() {
  return function (nodePath) {
    return nodePath.parent;
  };
}

function extractProperties() {
  for (var _len = arguments.length, properties = Array(_len), _key = 0; _key < _len; _key++) {
    properties[_key] = arguments[_key];
  }

  return function (nodePath) {
    return nodePath.get.apply(nodePath, properties);
  };
}