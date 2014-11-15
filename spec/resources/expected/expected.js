var SuperClass = require('my/long/name/space/SuperClass');
function SimpleClass() {
}

my.extend(SimpleClass, SuperClass);

SimpleClass.prototype.myMethod = function() {}

SimpleClass.prototype.anotherMethod = function() {}
module.exports = SimpleClass;
