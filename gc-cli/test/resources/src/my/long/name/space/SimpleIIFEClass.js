my.long.name.space.SimpleIIFEClass = (function() {
	'use strict';

	function SimpleIIFEClass() {}

	SimpleIIFEClass.prototype.myMethod = function() {
		this._member = new caplin.streamlink.SLJSClass();
		this._otherMember = new caplin.other.Class();
	}

	SimpleIIFEClass.prototype.anotherMethod = function() {}

	return SimpleIIFEClass;
}());
