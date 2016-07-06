'use strict';

var Class = require('caplin/other/Class');
require('alias!other.alias');
var sljs = require('sljs');

function SimpleIIFEClass() {
}

SimpleIIFEClass.prototype.myMethod = function() {
	this._member = new sljs.SLJSClass();
	this._otherMember = new Class();
};

SimpleIIFEClass.prototype.anotherMethod = function() {
	var someXML = '<other.alias />';
};

module.exports = SimpleIIFEClass;
