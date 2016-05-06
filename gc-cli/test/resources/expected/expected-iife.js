'use strict';

var Class = require('caplin/other/Class');
var sljs = require('sljs');
require('alias!other.alias');

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
