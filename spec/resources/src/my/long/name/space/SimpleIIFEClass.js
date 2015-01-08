my.long.name.space.SimpleIIFEClass = (function() {
	'use strict';

	function SimpleIIFEClass() {}

	caplin.extend(SimpleIIFEClass, my.long.name.space.SuperClass);

	SimpleIIFEClass.prototype.myMethod = function() {
		this._member = new caplin.streamlink.SLJSClass();
	}

	SimpleIIFEClass.prototype.anotherMethod = function() {}

	return SimpleIIFEClass;
}());
