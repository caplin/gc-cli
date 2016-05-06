'use strict';

var Interface = require('my/long/Interface');
var SuperClass = require('my/long/name/space/SuperClass');
var topiarist = require('topiarist');
var PropertyHelper = require('caplin/presenter/property/PropertyHelper');
require('alias!test.alias');

function SimpleClass() {
	this._service = require('service!test.alias');
	this.m_oPropertyHelper = new PropertyHelper;
}

topiarist.extend(SimpleClass, SuperClass);
topiarist.inherit(SimpleClass, Interface);

SimpleClass.prototype.myMethod = function() {};

SimpleClass.prototype.anotherMethod = function() {};

module.exports = SimpleClass;
