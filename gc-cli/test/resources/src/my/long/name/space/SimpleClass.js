my.long.name.space.SimpleClass = function() {
	this._service = caplin.core.ServiceRegistry.getService('test.alias');
	this.m_oPropertyHelper = new caplin.presenter.property.PropertyHelper;

	var proxy = caplin.core.ServiceRegistry
		.getService('caplin.event-service')
		.getProxy(
			'caplin.trading.ticket.TicketLauncher',
			'caplinx.launch.OrderTicket'
		);
}

caplin.extend(my.long.name.space.SimpleClass, my.long.name.space.SuperClass);
caplin.implement(my.long.name.space.SimpleClass, my.long.Interface);

my.long.name.space.SimpleClass.prototype.myMethod = function() {}

my.long.name.space.SimpleClass.prototype.anotherMethod = function() {}
