var MyConstants = require("my/other/constant/MyConstants");
var Factory__1 = require("my/other/name/space/duplicate/Factory");
var Reference = require("other/some/Reference");
var ClassWithConstants = require("my/constant/ClassWithConstants");
var SomeController__1 = require("other/spaced/class/SomeController");
var SimpleClass__1 = require("my/long/different/space/SimpleClass");
var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
var some = require("some");
var ClassName = require("other/name/space/ClassName");
var Factory = require("my/other/name/space/Factory");
var Field = require("my/long/name/space/Field");
var Utility__1 = require("my/simple/Utility");
var Utility;

function SimpleClass() {
	Utility = Utility__1;
	var test = new Field();
	this.aValue = Factory.callExpression(some.call('A Literal Value'));
	ClassName.callExpression(42);
}

my.extend(SimpleClass, SuperClass);
my.extend(SimpleClass, SimpleClass__1);

SimpleClass.prototype._initMethod = function() {
	var SomeController = SomeController__1;
	var SomeConstants = ClassWithConstants.CONSTANTS_REFERENCE;

	this.controller = new SomeController(SomeConstants.A_CONSTANT, some.call('More'));

	this.controller.someCall(Reference.ANOTHER_CONSTANT);
}

SimpleClass.prototype.callToSuper = function() {
	SuperClass.prototype.callToSuper.call(this);
	this.duplicateReference = Factory__1.someCall();

	this._local = MyConstants.MyLowerCaseConstant;
}
module.exports = SimpleClass;
