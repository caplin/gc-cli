/**
 * Docs
 */
my.SimpleUtilityObject = {}

my.SimpleUtilityObject.staticUtilityMethod = function() {}

my.SimpleUtilityObject.anotherStaticUtilityMethod = function() {
	this.staticUtilityMethod();
}
