var MyConstants = require("my/other/constant/MyConstants");
var Factory1 = require("my/other/name/space/duplicate/Factory");
var Reference = require("other/some/Reference");
var ClassWithConstants = require("my/constant/ClassWithConstants");
var SomeController1 = require("other/spaced/class/SomeController");
var SimpleClass1 = require("my/long/different/space/SimpleClass");
var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
var ClassName = require("other/name/space/ClassName");
var Factory = require("my/other/name/space/Factory");
var Field = require("my/long/name/space/Field");
var Utility1 = require("my/simple/Utility");
var Utility;

function SimpleClass() {
	Utility = Utility1;
	var test = new Field();
	this.aValue = Factory.callExpression('A Literal Value');
	ClassName.callExpression(42);
}

my.extend(SimpleClass, SuperClass);
my.extend(SimpleClass, SimpleClass1);

SimpleClass.prototype._initMethod = function() {
	var SomeController = SomeController1;
	var SomeConstants = ClassWithConstants.CONSTANTS_REFERENCE;

	this.controller = new SomeController(SomeConstants.A_CONSTANT, Reference.SOME_CONSTANT);

	this.controller.someCall(Reference.ANOTHER_CONSTANT);
}

SimpleClass.prototype.callToSuper = function() {
	SuperClass.prototype.callToSuper.call(this);
	this.duplicateReference = Factory1.someCall();

	this._local = MyConstants.MyLowerCaseConstant;
}
module.exports = SimpleClass;
