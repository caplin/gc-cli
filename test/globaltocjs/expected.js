var SuperClass = require("my.long.name.space.SuperClass");
var Field = require("my.long.name.space.Field");
function SimpleClass() {
	var test = new Field();
	this.aValue = my.other.name.space.Factory.callExpression('A Literal Value');
}

my.extend(SimpleClass, SuperClass);
