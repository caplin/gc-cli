var INPUT_FIELDS;

my.name.space.feature.SomeClass = function() {

	var TRADE_FIELDS = my.name.space.feature.Constants.TRADE_FIELDS,
		LEG_FIELDS = my.name.space.feature.Constants.TRADE_LEG_FIELDS;

	INPUT_FIELDS = my.name.space.feature.presentation.node;

	this.FIELDS = my.name.space.feature.presentation.OtherConstants.FIELDS;

	this.legID = this._member.getProperty(LEG_FIELDS.LEG_ID);
	this.isPercentageBased = this._member.get(TRADE_FIELDS.PERCENTAGE_BASED);
	this.percentage = new my.name.space.feature.Class(this._member.getEditableProperty(LEG_FIELDS.PERCENTAGE));

	this.account = new INPUT_FIELDS.SpecialField(this._member.getEditableProperty(LEG_FIELDS.ACCOUNT));
	this.dealtCurrency = new INPUT_FIELDS.AnotherField(this._member.getEditableProperty(LEG_FIELDS.DEALT_CURRENCY));

	this.nearDate = new my.name.space.feature.node.AField(
		this._member.get(LEG_FIELDS.NEAR_DATE),
		this._member.get(LEG_FIELDS.NEAR_TENOR)
	);

	this.far = new my.name.space.feature.presentation.node.FarField(
		this._member.get(LEG_FIELDS.FAR_DATE),
		this._member.get(LEG_FIELDS.FAR_TENOR),
		this._member.get(LEG_FIELDS.TRADING_TYPE)
	);

	this.nearDirection = this._member.get(LEG_FIELDS.NEAR_BUY_SELL);
	this.type = new INPUT_FIELDS.TypeField(this._member.get(LEG_FIELDS.TRADING_TYPE));
	this.direction = new INPUT_FIELDS.Field(new caplin.presenter.property.EditableProperty(this.nearDirection.getValue()));
};
