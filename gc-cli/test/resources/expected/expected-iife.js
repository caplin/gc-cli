'use strict';

var Class = require('caplin/other/Class');
var sljs = require('sljs');

function SimpleIIFEClass() {
}

SimpleIIFEClass.prototype.myMethod = function() {
	this._member = new sljs.SLJSClass();
	this._otherMember = new Class();
};

SimpleIIFEClass.prototype.anotherMethod = function() {};

module.exports = SimpleIIFEClass;
