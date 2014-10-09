var INPUT_FIELDS;

my.name.space.feature.SomeClass = function() {
    this.FIELDS = my.name.space.feature.presentation.OtherConstants.FIELDS;

    this.legID = this._member.getProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.LEG_ID);
    this.isPercentageBased = this._member.get(my.name.space.feature.Constants.TRADE_FIELDS.PERCENTAGE_BASED);
    this.percentage = new my.name.space.feature.Class(this._member.getEditableProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.PERCENTAGE));

    this.account = new my.name.space.feature.presentation.node.SpecialField(this._member.getEditableProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.ACCOUNT));
    this.dealtCurrency = new my.name.space.feature.presentation.node.AnotherField(this._member.getEditableProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.DEALT_CURRENCY));

    this.nearDate = new my.name.space.feature.node.AField(
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.NEAR_DATE),
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.NEAR_TENOR)
	);

    this.far = new my.name.space.feature.presentation.node.FarField(
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.FAR_DATE),
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.FAR_TENOR),
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.TRADING_TYPE)
	);

    this.nearDirection = this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.NEAR_BUY_SELL);
    this.type = new my.name.space.feature.presentation.node.TypeField(this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.TRADING_TYPE));
    this.direction = new my.name.space.feature.presentation.node.Field(new caplin.presenter.property.EditableProperty(this.nearDirection.getValue()));
};
