var Utility;

/**
 * Some docs.
 */
function SimpleClass() {
	Utility = my.simple.Utility;
	var test = new my.long.name.space.Field();
	this.aValue = my.other.name.space.Factory.callExpression('A Literal Value');
	other.name.space.ClassName.callExpression(42);
}

my.extend(SimpleClass, my.long.name.space.SuperClass);
my.extend(SimpleClass, my.long.different.space.SimpleClass);

SimpleClass.prototype._initMethod = function() {
	var SomeController = other.spaced.class.SomeController;
	var SomeConstants = my.constant.ClassWithConstants.CONSTANTS_REFERENCE;

	this.usingClassNameThatClashesWithGlobalNumber = new my.class.that.clashes.Number();
	this.controller = new SomeController(SomeConstants.A_CONSTANT, other.some.Reference.SOME_CONSTANT);

	this.controller.someCall(other.some.Reference.ANOTHER_CONSTANT);
}

SimpleClass.prototype.callToSuper = function() {
	my.long.name.space.SuperClass.prototype.callToSuper.call(this);
	this.duplicateReference = my.other.name.space.duplicate.Factory.someCall();

	this._local = my.other.constant.MyConstants.MyLowerCaseConstant;
}
