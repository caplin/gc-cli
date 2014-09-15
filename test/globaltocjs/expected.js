var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
var ClassName = require("other/name/space/ClassName");
var Factory = require("my/other/name/space/Factory");
var Field = require("my/long/name/space/Field");
function SimpleClass() {
	var test = new Field();
	this.aValue = Factory.callExpression('A Literal Value');
	ClassName.callExpression(42);
}

my.extend(SimpleClass, SuperClass);
