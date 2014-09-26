var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
'use strict';

function SimpleIIFEClass() {}

my.extend(SimpleIIFEClass, SuperClass);

SimpleIIFEClass.prototype.myMethod = function() {}

SimpleIIFEClass.prototype.anotherMethod = function() {}

module.exports = SimpleIIFEClass;
