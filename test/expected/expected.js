var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
function SimpleClass() {}

my.extend(SimpleClass, SuperClass);

SimpleClass.prototype.myMethod = function() {}

SimpleClass.prototype.anotherMethod = function() {}