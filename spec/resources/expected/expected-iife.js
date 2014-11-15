var SuperClass = require('my/long/name/space/SuperClass');
var streamlink = require('sljs');
'use strict';

function SimpleIIFEClass() {
}

my.extend(SimpleIIFEClass, SuperClass);

SimpleIIFEClass.prototype.myMethod = function() {
	this._member = new streamlink.SLJSClass();
}

SimpleIIFEClass.prototype.anotherMethod = function() {}

module.exports = SimpleIIFEClass;
