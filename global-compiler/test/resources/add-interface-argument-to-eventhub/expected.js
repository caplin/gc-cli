this._rowSelectionEventProxy = eventService.getProxy(
    'caplinx.fxblotters.orders.grid.service.OrderActionsOnRowSelectionListener',
    'orders.grid.onRowSelectionChange',
    caplinx.fxblotters.orders.grid.service.OrderActionsOnRowSelectionListener
);

var proxy = caplin.core.ServiceRegistry
	.getService('caplin.event-service')
	.getProxy(
    'caplin.trading.ticket.TicketLauncher',
    'caplinx.launch.OrderTicket',
    caplin.trading.ticket.TicketLauncher
);

eventServiceStub.getProxy.returns({
	launchTicket: spy
});

var proxy = require('service!caplin.event-service').getProxy(
    'caplinx.fxexecution.rfsticket.RFSTicket',
    '*',
    caplinx.fxexecution.rfsticket.RFSTicket
);

var proxy = caplin.core.ServiceRegistry.getService('caplin.event-service')
	.getProxy(
		'caplin.trading.ticket.TicketLauncher',
		this.m_sTicketChannel,
		caplin.trading.ticket.TicketLauncher
	);

eventService
	.getProxy(
    'caplinx.fxexecution.notification.presentation.NotificationList',
    '*',
    caplinx.fxexecution.notification.presentation.NotificationList
)
	.toggleVisible(false);

caplinx.fxexecution.testing.EventHubStub.prototype.getProxy = function(sInterface, sEventGroup) {}

EventHubStub.prototype = {
	getProxy: function() {
		return {
			launchTicket: launchTicket
		};
	}
}

eventService.subscribe(
    'caplinx.fxblotters.orders.trading.BulkOrderStateListener',
    'orders.bulkActions.onBulkOrderStateChange',
    this,
    caplinx.fxblotters.orders.trading.BulkOrderStateListener
);

PopoutStreamLinkProxy.prototype.subscribe = function(subject, subscriptionListener, subscriptionParameters) {
	var subscription = this.streamLink.subscribe(subject, subscriptionListener, subscriptionParameters);
}

caplin.core.ServiceRegistry.getService("caplin.event-service").subscribe(
    "caplinx.fxblotters.grid.decorator.ConfigurableExportDecorator",
    "*",
    this,
    caplinx.fxblotters.grid.decorator.ConfigurableExportDecorator
);

this.usersSubscription = streamLink.subscribe(
	'/PRIVATE/USERSEARCH/QUERY/user=' + searchString + '&client=' + clientContext,
	this._query.listener,
	{window: {start: startIndex, size: endIndex}}
);
