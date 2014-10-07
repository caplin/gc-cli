var Reference = require("other/some/Reference");
var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");

function SimpleClass() {
	aLibrary().plugin(42);

	globalLibrary.makeOfTypeGL(this);
}

my.extend(SimpleClass, SuperClass);
my.extend(SimpleClass, globalLibrary);

SimpleClass.prototype._initMethod = function() {
	this.controller = new SomeController(SomeConstants.A_CONSTANT, Reference.SOME_CONSTANT);

	this.controller.someCall(Reference.ANOTHER_CONSTANT);
}

SimpleClass.prototype.callToSuper = function() {
	SuperClass.prototype.callToSuper.call(this);
}
module.exports = SimpleClass;
