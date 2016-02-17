'use strict';

var Class = require('caplin/other/Class');
var streamlink = require('sljs');

function SimpleIIFEClass() {
}

SimpleIIFEClass.prototype.myMethod = function() {
	this._member = new streamlink.SLJSClass();
	this._otherMember = new Class();
};

SimpleIIFEClass.prototype.anotherMethod = function() {};

module.exports = SimpleIIFEClass;
