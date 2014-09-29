var SuperClass = require("my/long/name/space/SuperClass");
'use strict';

function SimpleIIFEClass() {}

my.extend(SimpleIIFEClass, SuperClass);

SimpleIIFEClass.prototype.myMethod = function() {}

SimpleIIFEClass.prototype.anotherMethod = function() {}

module.exports = SimpleIIFEClass;
