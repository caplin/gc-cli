var MyConstants = require("my/other/constant/MyConstants");
var DuplicateFactory = require("my/other/name/space/duplicate/Factory");
var Reference = require("other/some/Reference");
var ClashesNumber = require("my/class/that/clashes/Number");
var ClassWithConstants = require("my/constant/ClassWithConstants");
var ClassSomeController = require("other/spaced/class/SomeController");
var SpaceSimpleClass = require("my/long/different/space/SimpleClass");
var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
var ClassName = require("other/name/space/ClassName");
var Factory = require("my/other/name/space/Factory");
var Field = require("my/long/name/space/Field");
var SimpleUtility = require("my/simple/Utility");
var Utility;

function SimpleClass() {
	Utility = SimpleUtility;
	var test = new Field();
	this.aValue = Factory.callExpression('A Literal Value');
	ClassName.callExpression(42);
}

my.extend(SimpleClass, SuperClass);
my.extend(SimpleClass, SpaceSimpleClass);

SimpleClass.prototype._initMethod = function() {
	var SomeController = ClassSomeController;
	var SomeConstants = ClassWithConstants.CONSTANTS_REFERENCE;

	this.usingClassNameThatClashesWithGlobalNumber = new ClashesNumber();
	this.controller = new SomeController(SomeConstants.A_CONSTANT, Reference.SOME_CONSTANT);

	this.controller.someCall(Reference.ANOTHER_CONSTANT);
}

SimpleClass.prototype.callToSuper = function() {
	SuperClass.prototype.callToSuper.call(this);
	this.duplicateReference = DuplicateFactory.someCall();

	this._local = MyConstants.MyLowerCaseConstant;
}
module.exports = SimpleClass;
