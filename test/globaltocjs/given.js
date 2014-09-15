function SimpleClass() {
	var test = new my.long.name.space.Field();
	this.aValue = my.other.name.space.Factory.callExpression('A Literal Value');
	other.name.space.ClassName.callExpression(42);
}

my.extend(SimpleClass, my.long.name.space.SuperClass);
