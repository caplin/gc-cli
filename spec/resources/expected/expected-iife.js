'use strict';
var SuperClass = require('my/long/name/space/SuperClass');
var topiarist = require('topiarist');
var streamlink = require('sljs');

function SimpleIIFEClass() {
}

topiarist.extend(SimpleIIFEClass, SuperClass);

SimpleIIFEClass.prototype.myMethod = function() {
	this._member = new streamlink.SLJSClass();
}

SimpleIIFEClass.prototype.anotherMethod = function() {}

module.exports = SimpleIIFEClass;
