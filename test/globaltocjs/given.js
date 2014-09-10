function SimpleClass() {
	var test = new my.long.name.space.Field();
	this.aValue = my.other.name.space.Factory.callExpression();
}

my.extend(SimpleClass, my.long.name.space.SuperClass);
