my.long.name.space.SimpleIIFEClass = (function() {
	'use strict';

	function SimpleIIFEClass() {}

	my.extend(SimpleIIFEClass, my.long.name.space.SuperClass);

	SimpleIIFEClass.prototype.myMethod = function() {}

	SimpleIIFEClass.prototype.anotherMethod = function() {}

	return SimpleIIFEClass;
}());
