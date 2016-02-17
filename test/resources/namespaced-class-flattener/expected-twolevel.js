/**
 * Docs
 */
var SimpleUtilityObject = {};

SimpleUtilityObject.staticUtilityMethod = function() {}

SimpleUtilityObject.anotherStaticUtilityMethod = function() {
	this.staticUtilityMethod();
}
