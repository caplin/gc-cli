my.thirdparty('dep');

/**
 * Some documentation.
 *
 * @returns {[[Type]]} [[Description]]
 */
my.long.name.space.SimpleClass = (function() {

	/**
	 * Some docs.
	 */
	function SimpleClass(something, somethingElse) {
	}

	SimpleClass.prototype.aMethod = function() {
	};

	function lexicallyScopedFunction() {
	}

	return SimpleClass;
}());
