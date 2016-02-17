my.include('old');

/**
 * @constructor
 * @implements {my.interface.Interface}
 */
function SimpleClass() {}

my.extend(SimpleClass, my.long.name.space.SuperClass);

SimpleClass.prototype.myMethod = function() {}

SimpleClass.prototype.anotherMethod = function() {}
