var SuperClass = require("my/long/name/space/SuperClass");
var my = require("my");
var Factory = require("my/other/name/space/Factory");
var Field = require("my/long/name/space/Field");
function SimpleClass() {
	var test = new Field();
	this.aValue = Factory.callExpression('A Literal Value');
}

my.extend(SimpleClass, SuperClass);
